from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import csv
import io
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'pitchfire-super-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# n8n Webhook URL
N8N_WEBHOOK_URL = os.environ.get('N8N_WEBHOOK_URL', 'https://n8n.srv1019904.hstgr.cloud/webhook-test/process-leads')

# Create the main app
app = FastAPI(title="PitchFire API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ============================================================
# MODELS
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    proposals_used: int
    proposals_limit: int
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BusinessConfig(BaseModel):
    business_name: str = ""
    business_description: str = ""
    services_offered: str = ""
    target_audience: str = ""
    unique_value_proposition: str = ""
    # Pricing tiers
    pricing_tiers: List[Dict[str, Any]] = []
    # Contact info
    owner_name: str = ""
    owner_email: str = ""
    owner_photo_url: str = ""
    calendar_link: str = ""
    website_url: str = ""
    # Demo/Portfolio
    demo_videos: List[str] = []
    portfolio_links: List[str] = []
    # GitHub integration
    github_username: str = ""
    github_repo: str = ""
    github_token: str = ""

class LeadInput(BaseModel):
    input_type: str  # "job_description", "single_lead", "csv"
    platform: str = "other"  # "upwork", "fiverr", "freelancer", "linkedin", "cold_email", "other"
    # For job_description
    job_description: str = ""
    job_url: str = ""
    # For single_lead
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    company_name: str = ""
    company_website: str = ""
    company_description: str = ""
    job_title: str = ""
    linkedin: str = ""
    industry: str = ""
    # Additional context
    additional_context: str = ""

class ProposalCreate(BaseModel):
    lead_input: LeadInput
    business_config_override: Optional[Dict[str, Any]] = None

class ProposalResponse(BaseModel):
    id: str
    user_id: str
    status: str  # "pending", "processing", "completed", "failed"
    lead_data: Dict[str, Any]
    proposal_url: Optional[str] = None
    proposal_html: Optional[str] = None
    icp_score: Optional[int] = None
    recommended_tier: Optional[str] = None
    monthly_savings: Optional[int] = None
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None

class PlanUpgrade(BaseModel):
    plan: str  # "starter", "pro", "agency"
    billing_cycle: str = "monthly"  # "monthly", "annual"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_plan_limits(plan: str) -> int:
    limits = {
        "free": 5,
        "starter": 30,
        "pro": 100,
        "agency": 999999  # Unlimited
    }
    return limits.get(plan, 5)

# ============================================================
# AUTH ROUTES
# ============================================================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "plan": "free",
        "proposals_used": 0,
        "proposals_limit": 5,
        "business_config": {},
        "setup_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            plan="free",
            proposals_used=0,
            proposals_limit=5,
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            plan=user.get("plan", "free"),
            proposals_used=user.get("proposals_used", 0),
            proposals_limit=user.get("proposals_limit", 5),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        plan=user.get("plan", "free"),
        proposals_used=user.get("proposals_used", 0),
        proposals_limit=user.get("proposals_limit", 5),
        created_at=user["created_at"]
    )

# ============================================================
# BUSINESS CONFIG ROUTES
# ============================================================

@api_router.get("/business-config")
async def get_business_config(user: dict = Depends(get_current_user)):
    config = user.get("business_config", {})
    return {
        "config": config,
        "setup_completed": user.get("setup_completed", False)
    }

@api_router.put("/business-config")
async def update_business_config(config: BusinessConfig, user: dict = Depends(get_current_user)):
    config_dict = config.model_dump()
    
    # Don't store sensitive token in plain response
    safe_config = {k: v for k, v in config_dict.items() if k != "github_token"}
    if config_dict.get("github_token"):
        safe_config["github_configured"] = True
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "business_config": config_dict,
                "setup_completed": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Business config updated", "config": safe_config}

# ============================================================
# PROPOSAL ROUTES
# ============================================================

async def process_proposal_async(proposal_id: str, user_id: str, lead_input: dict, business_config: dict):
    """Background task to process proposal via n8n webhook"""
    try:
        # Update status to processing
        await db.proposals.update_one(
            {"id": proposal_id},
            {"$set": {"status": "processing", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Prepare payload for n8n
        payload = {
            "proposal_id": proposal_id,
            "user_id": user_id,
            "lead_input": lead_input,
            "business_config": business_config,
            "callback_url": f"{os.environ.get('BACKEND_URL', 'http://localhost:8001')}/api/proposals/{proposal_id}/callback"
        }
        
        # Send to n8n webhook
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(N8N_WEBHOOK_URL, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                # Update proposal with result
                update_data = {
                    "status": "completed",
                    "proposal_url": result.get("proposal_url"),
                    "proposal_html": result.get("proposal_html"),
                    "icp_score": result.get("icp_score"),
                    "recommended_tier": result.get("recommended_tier"),
                    "monthly_savings": result.get("monthly_savings"),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.proposals.update_one({"id": proposal_id}, {"$set": update_data})
            else:
                await db.proposals.update_one(
                    {"id": proposal_id},
                    {"$set": {
                        "status": "failed",
                        "error_message": f"n8n returned status {response.status_code}",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
    except Exception as e:
        logging.error(f"Error processing proposal {proposal_id}: {str(e)}")
        await db.proposals.update_one(
            {"id": proposal_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

@api_router.post("/proposals", response_model=ProposalResponse)
async def create_proposal(
    proposal_data: ProposalCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Check proposal limits
    proposals_used = user.get("proposals_used", 0)
    proposals_limit = user.get("proposals_limit", 5)
    
    if proposals_used >= proposals_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Proposal limit reached ({proposals_limit}). Please upgrade your plan."
        )
    
    proposal_id = str(uuid.uuid4())
    lead_data = proposal_data.lead_input.model_dump()
    
    proposal = {
        "id": proposal_id,
        "user_id": user["id"],
        "status": "pending",
        "lead_data": lead_data,
        "proposal_url": None,
        "proposal_html": None,
        "icp_score": None,
        "recommended_tier": None,
        "monthly_savings": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "error_message": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.proposals.insert_one(proposal)
    
    # Increment proposals_used
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"proposals_used": 1}}
    )
    
    # Get business config
    business_config = proposal_data.business_config_override or user.get("business_config", {})
    
    # Start background processing
    background_tasks.add_task(
        process_proposal_async,
        proposal_id,
        user["id"],
        lead_data,
        business_config
    )
    
    return ProposalResponse(**{k: v for k, v in proposal.items() if k != "_id"})

@api_router.get("/proposals", response_model=List[ProposalResponse])
async def get_proposals(user: dict = Depends(get_current_user)):
    proposals = await db.proposals.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [ProposalResponse(**p) for p in proposals]

@api_router.get("/proposals/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: str, user: dict = Depends(get_current_user)):
    proposal = await db.proposals.find_one(
        {"id": proposal_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    return ProposalResponse(**proposal)

@api_router.post("/proposals/{proposal_id}/callback")
async def proposal_callback(proposal_id: str, data: dict):
    """Callback endpoint for n8n to update proposal status"""
    update_data = {
        "status": data.get("status", "completed"),
        "proposal_url": data.get("proposal_url"),
        "proposal_html": data.get("proposal_html"),
        "icp_score": data.get("icp_score"),
        "recommended_tier": data.get("recommended_tier"),
        "monthly_savings": data.get("monthly_savings"),
        "error_message": data.get("error_message"),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.proposals.update_one({"id": proposal_id}, {"$set": update_data})
    return {"message": "Updated"}

# ============================================================
# CSV UPLOAD ROUTE
# ============================================================

@api_router.post("/proposals/batch")
async def create_batch_proposals(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(get_current_user)
):
    """Upload CSV file to create multiple proposals"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    leads = list(reader)
    
    # Check limits
    proposals_used = user.get("proposals_used", 0)
    proposals_limit = user.get("proposals_limit", 5)
    remaining = proposals_limit - proposals_used
    
    if len(leads) > remaining:
        raise HTTPException(
            status_code=403,
            detail=f"Not enough proposals remaining. Need {len(leads)}, have {remaining}."
        )
    
    created_proposals = []
    business_config = user.get("business_config", {})
    
    for lead in leads[:remaining]:
        proposal_id = str(uuid.uuid4())
        
        lead_data = {
            "input_type": "csv",
            "platform": "other",
            "first_name": lead.get("first_name", ""),
            "last_name": lead.get("last_name", ""),
            "email": lead.get("email", ""),
            "company_name": lead.get("company_name", ""),
            "company_website": lead.get("company_website", lead.get("website", "")),
            "company_description": lead.get("company_description", lead.get("description", "")),
            "job_title": lead.get("job_title", lead.get("title", "")),
            "linkedin": lead.get("linkedin", ""),
            "industry": lead.get("industry", "")
        }
        
        proposal = {
            "id": proposal_id,
            "user_id": user["id"],
            "status": "pending",
            "lead_data": lead_data,
            "proposal_url": None,
            "proposal_html": None,
            "icp_score": None,
            "recommended_tier": None,
            "monthly_savings": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "error_message": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.proposals.insert_one(proposal)
        created_proposals.append(proposal_id)
        
        # Queue for processing
        if background_tasks:
            background_tasks.add_task(
                process_proposal_async,
                proposal_id,
                user["id"],
                lead_data,
                business_config
            )
    
    # Update proposals_used
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"proposals_used": len(created_proposals)}}
    )
    
    return {
        "message": f"Created {len(created_proposals)} proposals",
        "proposal_ids": created_proposals
    }

# ============================================================
# PLAN ROUTES
# ============================================================

@api_router.post("/plans/upgrade")
async def upgrade_plan(upgrade: PlanUpgrade, user: dict = Depends(get_current_user)):
    """Upgrade user plan - placeholder for payment integration"""
    plan_limits = {
        "starter": 30,
        "pro": 100,
        "agency": 999999
    }
    
    if upgrade.plan not in plan_limits:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # TODO: Integrate with payment provider (Skydo)
    # For now, just update the plan
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "plan": upgrade.plan,
                "proposals_limit": plan_limits[upgrade.plan],
                "billing_cycle": upgrade.billing_cycle,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": f"Upgraded to {upgrade.plan} plan",
        "plan": upgrade.plan,
        "proposals_limit": plan_limits[upgrade.plan]
    }

@api_router.get("/plans")
async def get_plans():
    """Get available plans and pricing"""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price_monthly": 0,
                "price_annual": 0,
                "proposals_limit": 5,
                "features": [
                    "5 proposals total",
                    "AI research & personalization",
                    "Basic branding",
                    "Email support"
                ]
            },
            {
                "id": "starter",
                "name": "Starter",
                "price_monthly": 4.98,
                "price_annual": 47.88,  # ~20% off
                "proposals_limit": 30,
                "features": [
                    "30 proposals/month",
                    "AI research & personalization",
                    "Custom branding",
                    "CSV upload",
                    "GitHub hosting",
                    "Priority support"
                ]
            },
            {
                "id": "pro",
                "name": "Pro",
                "price_monthly": 9.98,
                "price_annual": 95.88,  # ~20% off
                "proposals_limit": 100,
                "popular": True,
                "features": [
                    "100 proposals/month",
                    "Everything in Starter",
                    "Advanced analytics",
                    "3 team members",
                    "API access"
                ]
            },
            {
                "id": "agency",
                "name": "Agency",
                "price_monthly": 19.98,
                "price_annual": 191.88,  # ~20% off
                "proposals_limit": 999999,
                "features": [
                    "Unlimited proposals",
                    "Everything in Pro",
                    "10 team members",
                    "Custom integrations",
                    "Dedicated support"
                ]
            }
        ]
    }

# ============================================================
# STATS ROUTE
# ============================================================

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    """Get user statistics"""
    proposals = await db.proposals.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    total = len(proposals)
    completed = len([p for p in proposals if p.get("status") == "completed"])
    pending = len([p for p in proposals if p.get("status") in ["pending", "processing"]])
    failed = len([p for p in proposals if p.get("status") == "failed"])
    
    avg_icp = 0
    icp_scores = [p.get("icp_score", 0) for p in proposals if p.get("icp_score")]
    if icp_scores:
        avg_icp = sum(icp_scores) / len(icp_scores)
    
    return {
        "total_proposals": total,
        "completed": completed,
        "pending": pending,
        "failed": failed,
        "average_icp_score": round(avg_icp, 1),
        "proposals_used": user.get("proposals_used", 0),
        "proposals_limit": user.get("proposals_limit", 5),
        "plan": user.get("plan", "free")
    }

# ============================================================
# PUBLIC PROPOSAL VIEW
# ============================================================

@api_router.get("/public/proposals/{proposal_id}")
async def get_public_proposal(proposal_id: str):
    """Get proposal HTML for public viewing"""
    proposal = await db.proposals.find_one(
        {"id": proposal_id, "status": "completed"},
        {"_id": 0, "proposal_html": 1, "proposal_url": 1}
    )
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    return {
        "proposal_html": proposal.get("proposal_html"),
        "proposal_url": proposal.get("proposal_url")
    }

# ============================================================
# HEALTH CHECK
# ============================================================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PitchFire API"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
