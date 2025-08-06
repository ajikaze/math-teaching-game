# Math Teaching Game Project

## Project Overview
A math teaching application with AI-powered tutoring using React frontend and Node.js backend with Gemini AI integration.

## Project Structure
```
math-teaching-game/
├── frontend (root level)
│   ├── src/
│   │   ├── components/
│   │   │   └── MathTeachingGame.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   ├── services/
    │   └── server.ts
    └── package.json
```

## Technology Stack
### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling

### Backend
- Node.js with Express
- TypeScript
- Gemini AI integration
- Security middleware and rate limiting

## Development Commands

### Start Development Servers
Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
npm run dev
```

### Build Commands
```bash
npm run build
```

### Lint Commands
```bash
npm run lint
```

## Environment Setup
- Backend requires Gemini API key in environment variables
- Backend runs on http://localhost:3001
- Frontend runs on http://localhost:5173

## Key Features
- AI-powered math tutoring with Gemini
- Interactive chat interface
- Health check endpoints
- Error handling and logging
- Security middleware