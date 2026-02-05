# Authentication & Access Control Implementation

## Overview
Implemented comprehensive authentication and role-based access control to protect all routes and API endpoints.

## Changes Made

### 1. Backend Protection
**File:** `middleware/auth.js` (new)
- Created `requireAuth` middleware to validate user authentication via headers
- Created `requireRole` middleware for role-based access control
- Protected all `/api/*` routes with authentication

**File:** `index.js`
- Added authentication middleware to all API routes
- Reorganized static file serving to separate public and protected assets
- Public routes: `/auth`, `/styles`, `/assets`, `/scripts/auth-guard.js`
- Protected routes: `/admin`, `/staff`, `/client`

### 2. Frontend Protection
**File:** `public/scripts/auth-guard.js` (new)
- Client-side route guard that runs on every page load
- Redirects unauthenticated users to login page
- Enforces role-based access:
  - `/admin/*` → admin only
  - `/staff/*` → staff and admin only
  - `/client/*` → client and admin only
- Auto-redirects authenticated users away from login page

**File:** `public/scripts/api-interceptor.js` (new)
- Intercepts all fetch requests to `/api/*` endpoints
- Automatically adds authentication headers (`X-User-Id`, `X-User-Role`)
- Handles 401/403 responses by clearing localStorage and redirecting to login

### 3. Login Enhancement
**File:** `public/scripts/login.js`
- Now stores `userRole` in localStorage (in addition to `userId`, `userName`, `userEmail`)
- Required for role-based access control

### 4. Protected Pages Updated
Added auth-guard.js and api-interceptor.js to all protected HTML pages:

**Admin Pages:**
- `/public/admin/index.html`
- `/public/admin/management.html`
- `/public/admin/reports.html`
- `/public/admin/notification-history.html`

**Staff Pages:**
- `/public/staff/index.html`
- `/public/staff/details.html`
- `/public/staff/notification-history.html`

**Client Pages:**
- `/public/client/index.html`
- `/public/client/create-ticket.html`

## How It Works

### Authentication Flow
1. User logs in → credentials validated → `userId`, `userRole` stored in localStorage
2. User navigates to protected page → `auth-guard.js` checks localStorage
3. If not authenticated → redirect to `/auth/login.html`
4. If authenticated but wrong role → show alert and redirect to login
5. API requests automatically include auth headers via `api-interceptor.js`
6. Backend validates headers via `requireAuth` middleware
7. If invalid → returns 401/403 → frontend clears session and redirects

### Role-Based Access
- **Admin**: Can access `/admin`, `/staff`, `/client` routes
- **Staff**: Can access `/staff` routes only
- **Client**: Can access `/client` routes only
- **Unauthenticated**: Can only access `/auth/login.html`

### Logout
Logout buttons already clear localStorage including:
- `userId`
- `userRole`
- `userName`
- `userEmail`

## Security Features
✅ Frontend route protection (immediate redirect)
✅ Backend API protection (401/403 responses)
✅ Role-based access control
✅ Automatic auth header injection
✅ Session cleanup on logout/unauthorized
✅ No hardcoded credentials
✅ Persistent session via localStorage

## Testing
1. Try accessing `/admin` without login → redirects to login
2. Login as staff → try accessing `/admin` → access denied
3. Login as admin → can access all routes
4. Logout → session cleared, all routes protected
5. API calls without auth → returns 401

## Notes
- Uses localStorage for session management (client-side only)
- For production: consider JWT tokens and HttpOnly cookies
- Auth headers: `X-User-Id` and `X-User-Role`
- No server-side session management (stateless)
