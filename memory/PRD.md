# PitchFire - Product Requirements Document

## Overview
PitchFire is a multi-tenant SaaS application that generates AI-powered, personalized HTML proposals for freelancers and agencies.

## Original Problem Statement
Convert a personal n8n workflow into a universal, multi-tenant SaaS application that allows users to generate highly-styled, personalized HTML proposals using AI.

## User Personas
- **Freelancers**: Solo contractors on Upwork, Fiverr, Freelancer who need personalized proposals
- **Agencies**: Teams that need to scale outreach without sacrificing personalization
- **Sales Teams**: Cold outreach teams looking to boost conversion rates

## Core Features

### Authentication
- [x] JWT-based custom authentication (signup/login)
- [x] Protected routes for dashboard and settings
- [x] Auth modal with login/signup modes
- [ ] Google Sign-In (Supabase Auth) - Future
- [ ] Free trial abuse prevention (IP/device fingerprinting) - Future

### Proposal Creation (3 Input Methods)
- [x] Job Description: Paste from Upwork, Fiverr, etc.
- [x] Single Lead: Manual form with contact/company details
- [x] CSV Upload: Batch processing of multiple leads

### User Configuration (Settings)
- [x] Business Info: Name, services, target audience, UVP
- [x] Pricing Tiers: Custom pricing to display in proposals
- [x] Contact Info: Name, email, photo, calendar link, website
- [x] GitHub Integration: For paid plan hosting (UI ready, backend pending)

### Pricing Tiers
| Plan | Monthly | Annual | Proposals |
|------|---------|--------|-----------|
| Free | $0 | $0 | 5 total |
| Starter | $4.98 | $47.88 | 30/month |
| Pro | $9.98 | $95.88 | 100/month |
| Agency | $19.98 | $191.88 | Unlimited |

### Dashboard
- [x] Usage stats (proposals used/remaining)
- [x] Completed/Processing/Failed counts
- [x] Average ICP Score display
- [x] Recent proposals list
- [x] Upgrade banner for free users

## Technical Architecture

### Frontend (React)
- React 19 with react-router-dom v7
- TailwindCSS with custom fire theme
- Shadcn/UI components
- AuthContext for state management

### Backend (FastAPI)
- Python FastAPI
- MongoDB (Motor async driver)
- JWT authentication
- Background task processing

### Database Schema (MongoDB)
- **users**: id, email, password, name, plan, proposals_used, proposals_limit, business_config, created_at
- **proposals**: id, user_id, status, lead_data, proposal_url, proposal_html, icp_score, created_at

## What's Been Implemented (as of Jan 25, 2026)

### Frontend Pages
- [x] Landing Page with hero, features, use cases, pricing preview
- [x] Dashboard with stats and proposals list
- [x] Create Proposal with 3 input methods
- [x] Settings with 4 configuration tabs
- [x] Pricing Page with monthly/annual toggle

### Backend Endpoints
- [x] POST /api/auth/signup - User registration
- [x] POST /api/auth/login - User authentication
- [x] GET /api/auth/me - Get current user
- [x] GET/PUT /api/business-config - Business settings
- [x] POST /api/proposals - Create proposal
- [x] GET /api/proposals - List user proposals
- [x] GET /api/proposals/{id} - Get specific proposal
- [x] POST /api/proposals/batch - CSV upload
- [x] GET /api/stats - User statistics
- [x] GET /api/plans - Available plans
- [x] GET /api/health - Health check

## Pending/Future Tasks

### P0 (High Priority)
- [ ] n8n Workflow Generation - Create universal, mergeable workflow JSON
- [ ] Connect to actual AI services for proposal generation
- [ ] Payment Integration (Skydo links - placeholders in place)

### P1 (Medium Priority)
- [ ] Google Sign-In integration
- [ ] Free trial abuse prevention
- [ ] GitHub hosting for paid plans (push HTML to user repos)
- [ ] Proposal viewing/preview page

### P2 (Low Priority)
- [ ] Team members feature (Pro/Agency plans)
- [ ] API access for Pro/Agency plans
- [ ] Advanced analytics
- [ ] Custom integrations

## Environment Variables

### Backend (.env)
- MONGO_URL - MongoDB connection string
- DB_NAME - Database name
- JWT_SECRET - Secret for JWT tokens
- N8N_WEBHOOK_URL - Webhook for n8n processing
- SUPABASE_URL - Supabase project URL (for future auth)
- SUPABASE_ANON_KEY - Supabase anon key
- SUPABASE_SERVICE_KEY - Supabase service role key

### Frontend (.env)
- REACT_APP_BACKEND_URL - Backend API URL

## Test Coverage
- Backend: 19 API tests (100% pass)
- Frontend: All UI flows tested
- Test user: test@pitchfire.com / testpass123
