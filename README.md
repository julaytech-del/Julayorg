# WorkOS — AI-Powered Universal Work Operating System

A complete AI-powered project management platform that generates full project plans from text descriptions.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (running locally on port 27017)
- Anthropic API key (optional — falls back to smart mock data)

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env and add your ANTHROPIC_API_KEY (optional)
npm run seed        # Seeds demo data
npm run dev         # Start backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Start frontend on http://localhost:3000
```

### 3. Login
Open http://localhost:3000 and login with:
- **Admin:** admin@techcorp.com / password123
- **Manager:** pm@techcorp.com / password123
- **Designer:** designer@techcorp.com / password123

## AI Features

### Generate Full Plan
1. Go to **AI Studio** page
2. Type: "Build a company website"
3. Click **Generate Full Plan**
4. AI creates: project structure, 6 goals, 20+ tasks, team assignments, timeline

### Daily Standup
Select a project → AI analyzes progress → generates standup report with blockers, priorities, and insights.

### Performance Analysis
AI evaluates team velocity, completion rates, and provides recommendations.

### Auto Re-Plan
When delays occur, AI reschedules remaining tasks and adjusts timeline.

## Architecture

```
work-os/
├── backend/               # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── models/        # Mongoose schemas
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── services/ai/   # AI brain (Claude-powered)
│   │   └── seed/          # Demo data
│   └── server.js
│
└── frontend/              # React + Vite + MUI
    └── src/
        ├── pages/         # Dashboard, Projects, Kanban, Timeline, AI Studio
        ├── components/    # Layout, Tasks, Common UI
        └── store/         # Redux Toolkit state
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register with org |
| GET | /api/projects | List projects |
| POST | /api/ai/generate-plan | AI generate full project |
| GET | /api/ai/standup/:id | Daily standup report |
| GET | /api/ai/performance/:id | Performance analysis |
| POST | /api/ai/replan/:id | Auto replan |

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Anthropic SDK
**Frontend:** React 18, Vite, Material UI v6, Redux Toolkit, React Beautiful DnD, Recharts
