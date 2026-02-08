# IntroConnect Backend Development Checklist

#### **Phase 1: Environment Setup**
- [x] Create and activate Python virtual environment (`venv`)
- [x] Create `requirements.txt` (`fastapi`, `uvicorn`, `google-generativeai`, `python-dotenv`)
- [x] Create `.env` file and set `GEMINI_API_KEY`

#### **Phase 2: FastAPI Backbone**
- [x] Create `main.py` (App initialization & CORS settings)
- [x] Package folders (Create `__init__.py` in `routes/` and `engine/`)
- [x] Verify server status via Health Check API (`GET /`)

#### **Phase 3: AI Analysis Engine**
- [x] Create `engine/analyzer.py` (**Google Gemini** integration)
- [x] Design multi-source analysis prompt (Chat, Posts, etc.)
- [x] Implement JSON enforcement logic for output

#### **Phase 4: Matching Logic**
- [x] Create `engine/matcher.py`
- [x] Implement `Must Avoid` hard filter logic
- [x] Implement Social Energy scoring & candidate filtering
- [x] Implement interest-based weighting & ranking

#### **Phase 5: API Routes & Registration**
- [x] Create `routes/matching.py` (Analysis & Match result endpoints)
- [x] Create `routes/auth.py` (Basic user identification)
- [x] Register all routers in `main.py`

#### **Phase 6: Final Verification**
- [x] Verify Swagger UI accessibility (`/docs`)
- [x] Test AI analysis with sample data inputs

#### **Phase 7: AI-Driven Dynamic Onboarding**
- [x] Design System Prompt for the "Interviewer" persona
- [x] Implement `POST /matching/next-question` endpoint (Dynamic question generation)
- [x] Implement Session/History management logic (Storing conversation context)
- [x] Implement Conversation Termination logic (Min 2, Max 7 questions)
- [x] Integrate Q1-Q3 initial user data into AI context
- [x] Final Profile Generation based on full conversation history

#### **Phase 8: MongoDB Integration**
- [ ] Setup MongoDB connection utility (`backend/database.py`)
- [ ] Create CRUD operations for User Profile (Save/Update)
- [ ] Create Session management logic (Save/Fetch Chat History)
- [ ] Connect Database to API Routers (Dependency Injection)
