# GlucoSmart - Smart Diabetic Management System

## Overview

GlucoSmart is a full-stack web application for diabetic management that enables patients to track glucose readings and provides clinical intelligence for healthcare monitoring. The system supports both manual entry and OCR-based extraction from lab reports, with risk assessment algorithms that analyze glucose variability, trends, and patient compliance.

Key capabilities:
- User authentication via Replit Auth (OpenID Connect)
- Glucose logging with manual and OCR-based entry
- Time-series visualization of glucose trends
- Risk assessment engine (Stable/Moderate/High/Critical)
- Patient and doctor role support
- AI-powered OCR processing using OpenAI integration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Charts**: Recharts for glucose trend visualization
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with React plugin

Path aliases configured:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Authentication**: Replit Auth (OpenID Connect with Passport.js)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Multer for multipart/form-data handling

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`npm run db:push`)

Core tables:
- `users` - Authentication users (required for Replit Auth)
- `sessions` - Session storage (required for Replit Auth)
- `profiles` - User profiles with role (patient/doctor)
- `glucose_logs` - Glucose readings with type, source, confirmation status
- `risk_assessments` - Calculated risk levels with contributing factors

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Use Cases**: OCR text extraction from lab reports
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Risk Assessment Algorithm
Located in `server/services/risk.ts`:
- Analyzes 14-day glucose history
- Calculates coefficient of variation (CV) for variability scoring
- Tracks compliance based on logging frequency
- Generates risk levels: Stable, Moderate, High, Critical

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- Session and user data stored in PostgreSQL tables

### Authentication
- **Replit Auth**: OpenID Connect provider
- Required environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### AI Services
- **OpenAI API**: Used for OCR processing of lab report images
- Accessed through Replit AI Integrations proxy

### Key npm Dependencies
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `express` / `express-session`: HTTP server and session management
- `passport` / `openid-client`: Authentication
- `@tanstack/react-query`: Client-side data fetching
- `recharts`: Data visualization
- `multer`: File upload handling
- `openai`: AI API client