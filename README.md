# BragBoard - Employee Recognition Platform

## Overview
BragBoard is an internal employee recognition wall where employees can post shout-outs to appreciate their colleagues. It promotes a culture of recognition with tagging, reactions, commenting, and admin moderation.

It is deployed at [https://brag-board.vercel.app/](https://brag-board.vercel.app/).

**Status**: ✅ Complete and Ready  
**Created**: October 25, 2025

## Tech Stack
-   **Frontend**: React + Vite, Tailwind CSS for styling, Axios for API calls
-   **Backend**: FastAPI (Python) with SQLAlchemy ORM
-   **Database**: PostgreSQL
-   **Auth & Security**: JWT-based authentication, role-based access (admin / employee)
-   **Other**: React Router for navigation, react-icons for UI icons



## Database Schema
- **Users**: id, name, email, password, department, role, joined_at, profile_picture_url
- **ShoutOuts**: id, sender_id, message, created_at
- **ShoutOutRecipients**: id, shoutout_id, recipient_id
- **Comments**: id, shoutout_id, user_id, content, created_at
- **Reactions**: id, shoutout_id, user_id, type (like/clap/star)

## Features Implemented
✅ User registration and JWT authentication  
✅ Create and view shout-out posts with recipient tagging  
✅ Interactive feed with filtering (department, sender, date)  
✅ Reaction system (like, clap, star) with live counts  
✅ Comment threads with timestamps and user avatars  
✅ Admin dashboard with statistics and moderation tools  
✅ User profile management (view, edit name/email, upload/delete profile picture)  
✅ Email notifications for tagged users with a summary of shoutouts  
✅ Admin can delete any shout-out and comment  
✅ Users can delete their own shout-outs from their profile  
✅ First registered user automatically becomes admin  
✅ Theme toggle (light, dark, system)
✅ Improved profile picture clarity through backend image resizing
✅ User management in Admin Dashboard (view, update role, delete users)

### UI/UX Improvements
-   Modern, dark-themed dashboard with clear typography and spacing
-   Card-based layout for shout-outs with reactions, comments, and mentions
-   Search & filter options (by department, sender, etc.) for easier browsing
-   Responsive design so the app works on desktop and laptop resolutions
-   Consistent button styles, hover states, and feedback to match the brand feel

## Authentication Flow
-   **Register**: New users sign up with name, email, password, and department
-   **Login**: JWT access + refresh tokens issued on successful login
-   **Protected Routes**: Dashboard, shout-out creation, and admin panel are accessible only to authenticated users
-   **Role Handling**: First user becomes admin, others default to employee
-   **Profile**: Users can view their profile, see their own shout-outs and activity (and later extend to editing profile details and avatar)

## Security Features
- Passwords hashed with bcrypt
- JWT tokens for authentication
- SESSION_SECRET required (no insecure fallback)
- Database URL validation
- Admin-only endpoints protected
- Input validation with Pydantic

## How to Use

### First Time Setup
1. The first user to register will automatically be assigned the **admin** role
2. All subsequent users will be assigned the **employee** role
3. Admins can access the admin dashboard to view statistics and moderate content

### User Flow
1. **Register**: Click "Sign up" and create an account with name, email, password, and department
2. **Login**: Use your credentials to sign in
3. **Create Shout-Out**: Click "Create Shout-Out" to recognize colleagues. Profile photos are visible in mention suggestions.
4. **Tag Recipients**: Search for and tag team members you want to recognize. Clickable mentions will lead to their profiles.
5. **React & Comment**: Like, clap, or star shout-outs, and add comments. Profile pictures are visible in reactions and comments.
6. **Filter Feed**: Filter by department, sender, or date to see relevant shout-outs
7. **Manage Profile**: Access your profile to edit your name/email, upload a new profile picture, or delete your existing one.
8. **Manage Own Shoutouts**: Delete your own shoutouts from your profile page.

### Admin Features
-   View all users and their departments
-   Promote/demote users between employee and admin roles
-   Delete inappropriate shout-outs or comments
-   See high-level stats: total users, total shout-outs, comments, and reactions, plus department-wise activity

## API Endpoints (Highlights)
-   **POST /api/auth/register** – user registration
-   **POST /api/auth/login** – login, returns JWT tokens
-   **GET /api/auth/me** – current logged-in user
-   **GET /api/users** – list users (with optional department filter)
-   **GET /api/shoutouts** – list shout-outs (filters: department, sender, date)
-   **POST /api/shoutouts** – create a shout-out with one or more recipients
-   **POST /api/shoutouts/{id}/comments** – add a comment
-   **POST /api/shoutouts/{id}/reactions** – toggle reactions (like / clap / star)
-   **GET /api/admin/stats** – admin statistics overview

## Recent Changes
- **2025-12-01**: Implemented consistent UI for deletions with confirmation modals and toast notifications.
- **2025-11-14**: Implemented user management in Admin Dashboard.
- **2025-11-14**: Added sender and date filters to the dashboard.
- **2025-11-14**: Displayed profile photos in mention suggestions.
- **2025-11-14**: Implemented user profile management with picture upload/delete.
- **2025-11-14**: Ensured real-time profile picture updates across the application.
- **2025-11-14**: Added clickable mentions in shoutouts leading to user profiles.
- **2025-11-14**: Refined shoutout deletion logic: admins can delete any, users can delete their own from profile.
- **2025-11-14**: Improved profile picture clarity with backend image resizing.
- **2025-10-25**: Added theme toggle with light, dark, and system modes
- **2025-10-25**: Initial project setup with Python 3.11 and Node.js 20
- **2025-10-25**: Implemented complete backend with FastAPI, PostgreSQL, JWT auth
- **2025-10-25**: Built React frontend with Tailwind CSS and React Router
- **2025-10-25**: Fixed admin bootstrap - first user is auto-admin
- **2025-10-25**: Enhanced security - SESSION_SECRET now required
- **2025-10-25**: Configured workflows for backend (port 8000) and frontend (port 5000)

## Architecture

### Frontend
-   **pages/**: top-level screens like Login, Register, Dashboard
-   **components/**: reusable UI pieces (ShoutOutCard, CreateShoutout, UserManagement, etc.)
-   **context/**: Auth context for storing current user and tokens
-   **services/**: API layer wrapping Axios calls

### Backend
-   **models.py**: SQLAlchemy models (User, ShoutOut, Comment, Reaction, etc.)
-   **schemas.py**: Pydantic schemas for request/response validation
-   **main.py**: FastAPI app, routes, and business logic
-   **database.py**: engine, session, and Base configuration

## Environment Variables
The following environment variables are automatically configured:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for JWT tokens
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials

## Development Notes
- Backend runs on port 8000
- Frontend runs on port 5000
- Vite dev server proxies `/api` requests to backend
- Both workflows are configured and running
- Swagger UI available for backend testing at https://bragboard-h7gw.onrender.com/docs

## Deployment
The application is deployed and accessible at: [https://brag-board.vercel.app/](https://brag-board.vercel.app/)
