"""
PitchFire API Backend Tests
Tests for: Auth, Business Config, Proposals, Plans, Stats
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@pitchfire.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User"

# Existing test user
EXISTING_EMAIL = "test@pitchfire.com"
EXISTING_PASSWORD = "testpass123"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "PitchFire API"
        print("SUCCESS: Health check passed")


class TestAuthSignup:
    """Signup endpoint tests"""
    
    def test_signup_new_user(self):
        """Test creating a new user"""
        unique_email = f"test_signup_{uuid.uuid4().hex[:8]}@pitchfire.com"
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == unique_email
        assert user["name"] == TEST_NAME
        assert user["plan"] == "free"
        assert user["proposals_used"] == 0
        assert user["proposals_limit"] == 5
        assert "id" in user
        assert "created_at" in user
        
        print(f"SUCCESS: Signup created user with plan=free, proposals_limit=5")
    
    def test_signup_duplicate_email(self):
        """Test signup with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": EXISTING_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print("SUCCESS: Duplicate email signup correctly rejected")


class TestAuthLogin:
    """Login endpoint tests"""
    
    def test_login_existing_user(self):
        """Test login with existing user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == EXISTING_EMAIL
        assert "id" in user
        assert "plan" in user
        assert "proposals_used" in user
        assert "proposals_limit" in user
        
        print(f"SUCCESS: Login successful for {EXISTING_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()
        print("SUCCESS: Invalid credentials correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@pitchfire.com",
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 401
        print("SUCCESS: Non-existent user login correctly rejected")


class TestAuthMe:
    """Auth /me endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for existing user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_me_authenticated(self, auth_token):
        """Test getting current user info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == EXISTING_EMAIL
        assert "id" in data
        assert "plan" in data
        assert "proposals_used" in data
        assert "proposals_limit" in data
        
        print(f"SUCCESS: /auth/me returned user data")
    
    def test_get_me_unauthenticated(self):
        """Test /me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated /me correctly rejected")
    
    def test_get_me_invalid_token(self):
        """Test /me with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
        print("SUCCESS: Invalid token correctly rejected")


class TestBusinessConfig:
    """Business config endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_business_config(self, auth_token):
        """Test getting business config"""
        response = requests.get(
            f"{BASE_URL}/api/business-config",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "config" in data
        assert "setup_completed" in data
        
        print("SUCCESS: Business config retrieved")
    
    def test_update_business_config(self, auth_token):
        """Test updating business config"""
        config_data = {
            "business_name": "Test Business",
            "business_description": "Test description",
            "services_offered": "AI proposals",
            "target_audience": "Freelancers",
            "unique_value_proposition": "Fast and personalized",
            "pricing_tiers": [{"name": "Basic", "price": "$100", "description": "Basic tier", "features": "Feature 1, Feature 2"}],
            "owner_name": "Test Owner",
            "owner_email": "owner@test.com",
            "owner_photo_url": "",
            "calendar_link": "",
            "website_url": "https://test.com",
            "demo_videos": [],
            "portfolio_links": [],
            "github_username": "",
            "github_repo": "",
            "github_token": ""
        }
        
        response = requests.put(
            f"{BASE_URL}/api/business-config",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=config_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Business config updated"
        assert "config" in data
        
        # Verify data persisted by fetching again
        get_response = requests.get(
            f"{BASE_URL}/api/business-config",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["config"]["business_name"] == "Test Business"
        
        print("SUCCESS: Business config updated and verified")
    
    def test_business_config_unauthenticated(self):
        """Test business config without auth"""
        response = requests.get(f"{BASE_URL}/api/business-config")
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated business config correctly rejected")


class TestPlans:
    """Plans endpoint tests"""
    
    def test_get_plans(self):
        """Test getting available plans"""
        response = requests.get(f"{BASE_URL}/api/plans")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data
        plans = data["plans"]
        
        # Verify all 4 plans exist
        plan_ids = [p["id"] for p in plans]
        assert "free" in plan_ids
        assert "starter" in plan_ids
        assert "pro" in plan_ids
        assert "agency" in plan_ids
        
        # Verify free plan
        free_plan = next(p for p in plans if p["id"] == "free")
        assert free_plan["price_monthly"] == 0
        assert free_plan["proposals_limit"] == 5
        
        # Verify starter plan
        starter_plan = next(p for p in plans if p["id"] == "starter")
        assert starter_plan["price_monthly"] == 4.98
        assert starter_plan["proposals_limit"] == 30
        
        # Verify pro plan
        pro_plan = next(p for p in plans if p["id"] == "pro")
        assert pro_plan["price_monthly"] == 9.98
        assert pro_plan["proposals_limit"] == 100
        
        # Verify agency plan
        agency_plan = next(p for p in plans if p["id"] == "agency")
        assert agency_plan["price_monthly"] == 19.98
        assert agency_plan["proposals_limit"] == 999999
        
        print("SUCCESS: All 4 plans returned with correct pricing")


class TestStats:
    """Stats endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_stats(self, auth_token):
        """Test getting user stats"""
        response = requests.get(
            f"{BASE_URL}/api/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_proposals" in data
        assert "completed" in data
        assert "pending" in data
        assert "failed" in data
        assert "average_icp_score" in data
        assert "proposals_used" in data
        assert "proposals_limit" in data
        assert "plan" in data
        
        print(f"SUCCESS: Stats returned - plan={data['plan']}, used={data['proposals_used']}/{data['proposals_limit']}")
    
    def test_stats_unauthenticated(self):
        """Test stats without auth"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated stats correctly rejected")


class TestProposals:
    """Proposals endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_proposals(self, auth_token):
        """Test getting user proposals"""
        response = requests.get(
            f"{BASE_URL}/api/proposals",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        
        print(f"SUCCESS: Proposals list returned ({len(data)} proposals)")
    
    def test_proposals_unauthenticated(self):
        """Test proposals without auth"""
        response = requests.get(f"{BASE_URL}/api/proposals")
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated proposals correctly rejected")


class TestPlanUpgrade:
    """Plan upgrade endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for a fresh user"""
        # Create a new user for upgrade testing
        unique_email = f"test_upgrade_{uuid.uuid4().hex[:8]}@pitchfire.com"
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": TEST_PASSWORD,
            "name": "Upgrade Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not create test user")
    
    def test_upgrade_to_starter(self, auth_token):
        """Test upgrading to starter plan"""
        response = requests.post(
            f"{BASE_URL}/api/plans/upgrade",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"plan": "starter", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["plan"] == "starter"
        assert data["proposals_limit"] == 30
        
        # Verify by checking /auth/me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert me_response.status_code == 200
        user = me_response.json()
        assert user["plan"] == "starter"
        assert user["proposals_limit"] == 30
        
        print("SUCCESS: Upgraded to starter plan with 30 proposals limit")
    
    def test_upgrade_invalid_plan(self, auth_token):
        """Test upgrading to invalid plan"""
        response = requests.post(
            f"{BASE_URL}/api/plans/upgrade",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"plan": "invalid_plan", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 400
        print("SUCCESS: Invalid plan upgrade correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
