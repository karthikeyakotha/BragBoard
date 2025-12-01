# BragBoard - Employee Recognition Platform

## Overview
BragBoard is an internal employee recognition wall where employees can post shout-outs to appreciate their colleagues. It promotes a culture of recognition with tagging, reactions, commenting, and admin moderation.

**Status**: ✅ Complete and Ready  
**Created**: October 25, 2025

## Tech Stack
- **Frontend**: React 19 with Vite, Tailwind CSS 3, React Router, `react-hot-toast`
- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens (access + refresh)

## Project Structure
```
/backend          - FastAPI backend application
  /models.py      - Database models (User, ShoutOut, Comment, Reaction)
  /schemas.py     - Pydantic schemas for validation
  /auth.py        - JWT authentication utilities
  /main.py        - FastAPI application with all API endpoints
  /database.py    - Database configuration
  /uploads        - Directory for user profile pictures

/frontend         - React frontend application
  /src/pages      - Page components (Login, Register, Dashboard, AdminDashboard, Profile, UserProfile)
  /src/components - Reusable components (ShoutoutCard, CreateShoutout, Layout, ReactionViewer)
  /src/context    - Auth and Theme contexts for state management
  /src/services   - API service layer
```

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
✅ Clickable mentions in shoutouts leading to user profiles  
✅ Admin can delete any shout-out and comment  
✅ Users can delete their own shout-outs from their profile  
✅ First registered user automatically becomes admin  
✅ Theme toggle (light, dark, system)
✅ Improved profile picture clarity through backend image resizing
✅ User management in Admin Dashboard (view, update role, delete users)

### UI/UX Improvements
- **Consistent Deletion Flow**: Implemented a unified deletion process for shoutouts, comments, and users, ensuring a consistent user experience across the application.
- **Confirmation Modals**: Added UI confirmation modals for all delete actions to prevent accidental data loss.
- **Toast Notifications**: Integrated `react-hot-toast` to provide clear, non-intrusive feedback for successful or failed operations.

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
- Access admin dashboard from the main navigation (shield icon)
- View platform statistics (users, shout-outs, comments, reactions)
- See shout-out breakdown by department
- Delete any shout-out or comment directly from the feed or user profiles.
- **User Management**: View all users, update their roles (employee/admin), and delete user accounts.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (with optional department filter)
- `GET /api/users/{id}` - Get specific user
- `PATCH /api/users/me` - Update current user's profile (name, email)
- `POST /api/users/me/picture` - Upload current user's profile picture (resizes to 128x128)
- `DELETE /api/users/me/picture` - Delete current user's profile picture
- `GET /api/users/me/shoutouts` - Get shoutouts sent by the current user
- `DELETE /api/users/{id}` - Delete a user (admin only)

### Shout-Outs
- `POST /api/shoutouts` - Create new shout-out
- `GET /api/shoutouts` - Get all shout-outs (with filters for department, sender, start_date)
- `GET /api/shoutouts/{id}` - Get specific shout-out
- `POST /api/shoutouts/{id}/comments` - Add comment
- `POST /api/shoutouts/{id}/reactions` - Toggle reaction
- `GET /api/shoutouts/{id}/reactions` - Get reactions for a specific shout-out
- `DELETE /api/shoutouts/{id}` - Delete shout-out (admin or owner)
- `DELETE /api/comments/{id}` - Delete comment (admin or owner)

### Admin
- `PATCH /api/users/{id}/role` - Update user role (admin only)
- `GET /api/admin/stats` - Get platform statistics (admin only)

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
The frontend (React) communicates with the FastAPI backend via REST APIs using JWT authorization headers. The backend uses SQLAlchemy ORM to interact with PostgreSQL database. The frontend proxies API requests through Vite to the backend on port 8000.

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
- Swagger UI available at http://localhost:8000/docs for API testing
