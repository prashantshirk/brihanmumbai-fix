# BrihanMumbai Fix AI Project Context

This file is a handoff document for an AI or engineer who needs to understand and fix the current BrihanMumbai Fix project. It describes how the project is wired today, including frontend routes, backend endpoints, authentication, redirects, report flow, and known problems.

## Project Overview

BrihanMumbai Fix is a civic complaint platform for Mumbai citizens.

Users can:

- Register and log in.
- Upload an image of a civic issue.
- Send the image to the backend for AI analysis.
- Submit a complaint with location, ward, issue type, severity, department, and optional coordinates/details.
- View personal complaints on the dashboard.
- View a protected community feed.

Admins can:

- Log in through the authority portal.
- View all complaints.
- Filter/search complaints.
- View complaint details in a dialog.
- Update complaint status.

The project is split into:

- `frontend/`: Next.js 16 App Router app.
- `backend/`: Flask monolith API.
- Root docs: `ARCHITECTURE.md`, `FRONTEND_ARCHITECTURE.md`, `DEPLOYMENT.md`, and this context file.

Important note: the older architecture docs contain some stale items. Prefer this file plus the live source files when fixing current behavior.

## Repo Layout

Root:

- `README.md`: currently just a placeholder.
- `ARCHITECTURE.md`: long architecture document, partly stale.
- `FRONTEND_ARCHITECTURE.md`: long frontend architecture document, partly stale.
- `DEPLOYMENT.md`: deployment instructions.
- `.gitignore`: currently placeholder only at repo root.

Backend:

- `backend/app.py`: Flask monolith. Contains app setup, CORS, MongoDB connection, auth, admin routes, complaint routes, AI image analysis, feed, ward info, error handlers, and database index setup.
- `backend/create_admin.py`: terminal script to create an admin user in MongoDB. Admins are stored in the `users` collection with `role: "admin"`.
- `backend/requirements.txt`: Flask, CORS, pymongo, bcrypt, PyJWT, Gemini/Groq/Cloudinary dependencies, Pillow, python-magic, etc.
- `backend/render.yaml`: Render web service config.
- `backend/.env.example`: backend env template.

Frontend:

- `frontend/app/`: Next App Router pages.
- `frontend/components/landing/`: header, footer, hero, landing sections, feed preview.
- `frontend/components/ui/`: shadcn/Radix UI primitives.
- `frontend/lib/api.ts`: frontend API wrapper and API client modules.
- `frontend/lib/auth.ts`: sessionStorage helpers, frontend-domain cookie helpers, logout helpers.
- `frontend/middleware.ts`: Next middleware that protects frontend routes by verifying JWT cookies.
- `frontend/next.config.mjs`: Next config. Currently ignores TypeScript build errors and disables image optimization.
- `frontend/package.json`: scripts and dependencies.

## Runtime Stack

Frontend:

- Next.js `16.2.0`.
- React `19.2.4`.
- TypeScript `5.7.3`.
- Tailwind CSS v4 via `@tailwindcss/postcss`.
- shadcn/Radix UI components.
- `jose` is used in Next middleware to verify JWTs.
- `lucide-react` icons.
- Package manager appears to be `pnpm`.

Backend:

- Flask.
- Flask-CORS.
- PyMongo / MongoDB Atlas style URI.
- bcrypt for password hashing.
- PyJWT for tokens.
- Cloudinary for image upload.
- Google Generative AI Gemini for image analysis.
- Groq as fallback AI and for formal complaint text generation.
- Gunicorn for production.

## Environment Variables

Backend `.env` / Render env vars:

- `MONGO_URI`: required. Flask exits if missing.
- `JWT_SECRET`: required. Must be at least 32 characters for token generation.
- `FRONTEND_URL`: CORS allowed frontend origin. Defaults to `http://localhost:3000`.
- `GEMINI_API_KEY`: used for Gemini vision analysis.
- `GROQ_API_KEY`: used by Groq client.
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Frontend `.env.local` / Vercel env vars:

- `JWT_SECRET`: must match backend `JWT_SECRET` because Next middleware verifies Flask-issued JWTs.
- `NEXT_PUBLIC_API_URL`: backend base URL. Defaults in code to `http://localhost:5000` if missing.

Important: If `NEXT_PUBLIC_API_URL` is not configured in production, frontend API calls will try `http://localhost:5000`, which will fail for real users.

## Frontend Routes

Next App Router files:

- `/`: `frontend/app/page.tsx`. Landing page. Renders `Header`, `Hero`, `Stats`, `Features`, `HowItWorks`, `IssueCategories`, `FeedPreview`, `CTA`, `Footer`.
- `/login`: `frontend/app/login/page.tsx`. User login form. Calls `authAPI.login(email, password)`, then currently `router.push("/dashboard")`.
- `/register`: `frontend/app/register/page.tsx`. User registration form. Calls `authAPI.register(name, email, password)`, then currently `router.push("/dashboard")`.
- `/dashboard`: `frontend/app/dashboard/page.tsx`. Protected user page. Fetches user complaints using `complaintAPI.list(1, 10)`.
- `/report`: `frontend/app/report/page.tsx`. Protected user page. Three-step complaint flow: upload/analyze image, confirm location/ward/details, submit complaint.
- `/feed`: `frontend/app/feed/page.tsx`. Protected user page. Fetches community feed using `feedAPI.getPosts(page, 12)`.
- `/track`: `frontend/app/track/page.tsx`. Tracked by middleware as protected. Review source before changing behavior.
- `/wards`: `frontend/app/wards/page.tsx`. Public ward information page.
- `/contact`, `/docs`, `/faq`, `/legal`, `/support`: public informational pages.
- `/admin/login`: `frontend/app/admin/login/page.tsx`. Admin login form. Calls `adminAPI.login(email, password)`, then currently `router.push("/admin")`.
- `/admin`: `frontend/app/admin/page.tsx`. Protected admin dashboard. Fetches complaints/stats using `adminAPI.getComplaints({ page: 1, limit: 200 })` and `adminAPI.getStats()`.

There is no `frontend/app/admin/complaints/[id]/page.tsx` in the current tracked files. The admin detail view is currently implemented as a dialog inside `/admin`.

## Frontend Middleware And Redirects

File: `frontend/middleware.ts`.

The middleware verifies JWTs using `jose.jwtVerify` and `process.env.JWT_SECRET`. This secret must match the backend `JWT_SECRET`.

Matcher:

- `/`
- `/login`
- `/register`
- `/report/:path*`
- `/dashboard/:path*`
- `/feed/:path*`
- `/track/:path*`
- `/admin/:path*`

Middleware behavior:

1. Admin route protection:
   - Applies to paths starting with `/admin`, except `/admin/login`.
   - Reads cookie `bmf_admin_token`.
   - If missing, redirects to `/admin/login`.
   - If present but invalid or role is not `admin`, deletes `bmf_admin_token` and redirects to `/admin/login`.
   - If valid admin token, allows request.

2. User protected routes:
   - Protected paths are `/report`, `/dashboard`, `/feed`, `/track`.
   - Reads cookie `bmf_token`.
   - If missing, redirects to `/login?redirect=<original_path>`.
   - If present but invalid or role is not `user`, deletes `bmf_token` and redirects to `/login`.
   - If valid user token, allows request.

3. Auth-only pages:
   - Applies to `/login` and `/register`.
   - If `bmf_token` is valid user token, redirects to `/dashboard`.
   - If `bmf_admin_token` is valid admin token, redirects to `/admin`.

4. Root route:
   - If `/` and valid user token exists, redirects to `/dashboard`.
   - Root does not currently redirect admins.

Current issue: `middleware.ts` uses the Next `middleware` file convention. Next 16 build warns that the middleware file convention is deprecated and should migrate to `proxy`.

## Frontend Header Navigation

File: `frontend/components/landing/header.tsx`.

The header is a client component.

It determines `isLoggedIn` using:

- `hasUserSession()` from `frontend/lib/auth.ts`, which checks `sessionStorage.getItem("bmf_user_info")`.
- A browser cookie check for `bmf_token` using `document.cookie`.

If logged in:

- Shows `Community` link to `/feed`.
- Shows `Dashboard` link to `/dashboard`.
- Shows `Logout` button that calls `logout()` from `frontend/lib/auth.ts`.

If not logged in:

- Shows landing anchor links.
- Shows `Community` public-looking link to `/feed`, but `/feed` is protected by middleware so it redirects to login if not authenticated.
- Shows `Report Issue` button that routes to `/report` if logged in and `/login` otherwise.

Important issue: header client state can disagree with server middleware state during client-side navigation because it uses sessionStorage and JS-readable cookies, while middleware verifies request cookies server-side. This contributes to pages appearing wrong until manual refresh.

## Frontend Auth Helpers

File: `frontend/lib/auth.ts`.

Session keys:

- User info: `bmf_user_info` in `sessionStorage`.
- Admin info: `bmf_admin_info` in `sessionStorage`.

Cookie helpers:

- `setUserMiddlewareCookie(token)`: sets JS-readable frontend-domain cookie `bmf_token`.
- `setAdminMiddlewareCookie(token)`: sets JS-readable frontend-domain cookie `bmf_admin_token`.
- `clearUserMiddlewareCookie()`: expires `bmf_token`.
- `clearAdminMiddlewareCookie()`: expires `bmf_admin_token`.

Logout:

- `logout()`:
  - Removes `bmf_user_info`.
  - Clears frontend-domain `bmf_token`.
  - Calls `${NEXT_PUBLIC_API_URL}/api/auth/logout` with `credentials: "include"` to clear backend httpOnly cookie.
  - Sets `window.location.href = "/"`.

- `logoutAdmin()`:
  - Removes `bmf_admin_info`.
  - Clears frontend-domain `bmf_admin_token`.
  - Calls `${NEXT_PUBLIC_API_URL}/api/admin/logout` with `credentials: "include"` to clear backend httpOnly admin cookie.
  - Sets `window.location.href = "/admin/login"`.

Important issue: `logoutAdmin()` exists, but `/admin` page does not currently call it. The admin page logout icon is a plain link to `/`.

## Frontend API Client

File: `frontend/lib/api.ts`.

Base URL:

- `const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`.

Core function:

- `apiFetch<T>(path, options)` wraps `fetch`.
- Sends JSON content type unless body is `FormData`.
- Always sends `credentials: "include"`.
- On browser requests, if no explicit `Authorization` header is passed, it reads frontend-domain cookies:
  - `bmf_admin_token` for paths starting `/api/admin`.
  - `bmf_token` otherwise.
  - If token is found, sets `Authorization: Bearer <token>`.

Auth API:

- `authAPI.register(name, email, password)`:
  - POST `/api/auth/register`.
  - Saves user info in sessionStorage.
  - If JSON response contains `token`, calls `setUserMiddlewareCookie(token)`.

- `authAPI.login(email, password)`:
  - POST `/api/auth/login`.
  - Saves user info in sessionStorage.
  - If JSON response contains `token`, calls `setUserMiddlewareCookie(token)`.

- `authAPI.me()`:
  - GET `/api/auth/me`.

Complaint API:

- `complaintAPI.analyzeImage(formData)`:
  - POST `/api/analyze-image`.
  - `FormData` must include `image`.

- `complaintAPI.create(data)`:
  - POST `/api/complaints`.

- `complaintAPI.list(page, limit)`:
  - GET `/api/complaints?page=...&limit=...`.

- `complaintAPI.getOne(id)`:
  - GET `/api/complaints/:id`.

- `complaintAPI.updateStatus(id, status)`:
  - PATCH `/api/complaints/:id/status`.

Feed API:

- `feedAPI.preview()`:
  - GET `/api/feed/preview` using plain fetch and no credentials.
  - Intended for landing page preview.

- `feedAPI.getPosts(page, limit)`:
  - GET `/api/feed?page=...&limit=...` through `apiFetch`.

Admin API:

- `adminAPI.login(email, password)`:
  - POST `/api/admin/login`.
  - Saves admin info in sessionStorage.
  - If JSON response contains `token`, calls `setAdminMiddlewareCookie(token)`.

- `adminAPI.me()`:
  - GET `/api/admin/me`.

- `adminAPI.getComplaints(params)`:
  - GET `/api/admin/complaints`.

- `adminAPI.getComplaint(id)`:
  - GET `/api/admin/complaints/:id`.

- `adminAPI.updateStatus(id, status)`:
  - PATCH `/api/admin/complaints/:id/status`.

- `adminAPI.getStats()`:
  - GET `/api/admin/stats`.

Ward API:

- `wardAPI.getInfo(ward)`:
  - GET `/api/ward-info?ward=...`.

API wrapper error behavior:

- 401 on auth calls becomes friendly "Email or password is wrong" when backend says invalid credentials/user.
- 401 on other calls removes user session, clears `bmf_token`, and sends browser to `/login`.
- 403 removes admin session, clears `bmf_admin_token`, and sends browser to `/admin/login`.

## Backend App Setup

File: `backend/app.py`.

Startup:

- Calls `load_dotenv()`.
- Creates Flask `app`.
- Configures CORS.
- Requires `MONGO_URI`.
- Connects to MongoDB database `brihanmumbai_fix`.
- Uses collections:
  - `db.users`
  - `db.complaints`
  - `db.admins` is assigned but admin login currently uses `users` collection with `role: "admin"`.
- Configures Cloudinary from env.
- Imports and configures Google Generative AI.
- Creates Groq client from `GROQ_API_KEY`.
- Requires `JWT_SECRET`.
- Defines security headers after-request hook.
- Defines in-memory rate limiter.
- Defines input sanitizers and upload validator.

CORS allowed origins:

- `https://brihanmumbai-fix.vercel.app`
- `http://localhost:3000`
- `http://localhost:5173`
- `FRONTEND_URL` env value

CORS supports credentials and allows headers:

- `Content-Type`
- `Authorization`
- `X-Requested-With`

Cookie security:

- `get_cookie_security_options(request)` checks request host.
- Localhost/127.0.0.1: `secure=False`, `SameSite=Lax`.
- Other hosts: `secure=True`, `SameSite=None`.

Rate limiting:

- Uses process memory: `_rate_limit_store = defaultdict(list)`.
- Key is route function name plus IP.
- IP is read from `X-Forwarded-For` first, then `request.remote_addr`.
- Important issue: trusting raw `X-Forwarded-For` can allow spoofing if the proxy does not sanitize it.

## Backend Auth Model

JWT generation:

- `generate_token(user_id, role="user")`.
- Uses `JWT_SECRET`.
- Requires secret length >= 32.
- Payload contains:
  - `user_id`
  - `role`
  - `exp` 7 days
  - `iat`
- Algorithm: `HS256`.

User verification helper:

- `verify_token(request)`:
  - Reads `Authorization: Bearer <token>` first.
  - Falls back to cookie `bmf_token`.
  - Decodes JWT with `JWT_SECRET`.
  - Requires `user_id`, `exp`, and `role` claims.
  - Returns `user_id`.
  - Does not currently enforce role == user inside helper.

Admin verification helper:

- `verify_admin(request)`:
  - Reads `Authorization: Bearer <token>` first.
  - Falls back to cookie `bmf_admin_token`.
  - Decodes JWT with `JWT_SECRET`.
  - Requires `role == "admin"`.
  - Returns `user_id`.

Important backend inconsistency:

- Some endpoints use `verify_token(request)` and support cookies.
- Other endpoints manually require `Authorization` and return "Authorization header is missing" if no header exists.
- This can break flows when relying on backend httpOnly cookies only.
- Frontend currently works around this by reading frontend-domain cookie and injecting an Authorization header, but this depends on the backend returning the token in JSON and the frontend setting JS-readable cookies.

## Backend Routes

Health:

- `GET /health`
  - Returns backend status.

User auth:

- `POST /api/auth/register`
  - Rate limit: 5 requests / 900 seconds.
  - Validates name/email/password.
  - Checks duplicate email in `users`.
  - Hashes password with bcrypt cost 12.
  - Inserts user document into `users`.
  - Generates JWT with role `user`.
  - Sets httpOnly cookie `bmf_token`.
  - Returns user object and currently also returns `token` in JSON.

- `POST /api/auth/login`
  - Rate limit: 10 requests / 900 seconds.
  - Finds user by email.
  - Checks password.
  - Generates JWT with role `user`.
  - Sets httpOnly cookie `bmf_token`.
  - Returns user object and currently also returns `token` in JSON.

- `GET /api/auth/me`
  - Uses `verify_token(request)`.
  - Returns current user.

- `POST /api/auth/logout`
  - Clears httpOnly cookie `bmf_token`.
  - Returns success message.

Admin auth:

- `POST /api/admin/login`
  - Rate limit: 5 requests / 900 seconds.
  - Looks in `users` collection for document with email and `role: "admin"`.
  - Checks password.
  - Generates JWT with role `admin`.
  - Sets httpOnly cookie `bmf_admin_token`.
  - Returns admin object and currently also returns `token` in JSON.

- `GET /api/admin/me`
  - Uses `verify_admin(request)`.
  - Returns current admin.

- `POST /api/admin/logout`
  - Clears httpOnly cookie `bmf_admin_token`.
  - Returns success message.

Admin complaint management:

- `GET /api/admin/complaints`
  - Uses `verify_admin(request)`.
  - Supports pagination and filters.
  - Joins complaint user info by looking up user in `users`.
  - Returns list plus total/page/pages.

- `GET /api/admin/complaints/<complaint_id>`
  - Uses `verify_admin(request)`.
  - Returns one complaint with user name/email.

- `PATCH /api/admin/complaints/<complaint_id>/status`
  - Uses `verify_admin(request)`.
  - Updates complaint status.

- `GET /api/admin/stats`
  - Uses `verify_admin(request)`.
  - Returns total counts by status/type/severity.

Image analysis:

- `POST /api/analyze-image`
  - Rate limit: 20 requests / 3600 seconds.
  - Current code manually requires `Authorization` header and does not use `verify_token(request)`.
  - Expects multipart form field `image`.
  - `validate_upload(file)` checks size and MIME/extension. Max 5 MB.
  - Uploads image to Cloudinary folder `brihanmumbai`.
  - Calls `analyze_image_with_fallback(image_url)`.
  - Returns `image_url`, `issue_type`, `severity`, `description`, `department`, `confidence`, `model_used`.
  - On AI analysis failure, returns a default successful analysis response with `model_used: "error"`.

Complaint routes:

- `POST /api/complaints`
  - Rate limit: 30 requests / 3600 seconds.
  - Current code manually requires `Authorization` header and does not use `verify_token(request)`.
  - Validates `image_url`, `issue_type`, `location`, ward/status/severity, etc.
  - Requires `image_url` to start with `https://res.cloudinary.com/`.
  - Generates formal complaint text via Groq with fallback.
  - Inserts complaint into MongoDB.
  - Returns created complaint.

- `GET /api/complaints`
  - Current code manually requires `Authorization` header and does not use `verify_token(request)`.
  - Returns authenticated user's complaints with pagination.

- `GET /api/complaints/<complaint_id>`
  - Current code manually requires `Authorization` header and does not use `verify_token(request)`.
  - Returns complaint only if owned by authenticated user.

- `PATCH /api/complaints/<complaint_id>/status`
  - Current code manually requires `Authorization` header and does not use `verify_token(request)`.
  - Updates complaint status if owned by authenticated user.
  - This is a user-accessible status update endpoint; verify whether that is intended. Admin status updates also exist separately.

Feed:

- `GET /api/feed/preview`
  - Rate limit: 120 requests / 60 seconds.
  - Public route.
  - Returns recent complaints for landing page preview.

- `GET /api/feed`
  - Rate limit: 60 requests / 60 seconds.
  - Uses `verify_token(request)`.
  - Protected route.
  - Returns community feed with pagination.

Ward info:

- `GET /api/ward-info?ward=<ward>`
  - Returns contact info for a BMC ward.

Error handlers:

- 400, 401, 403, 404, 405, 413, 429, 500, and generic exception handlers return JSON.

## Report Issue Flow

File: `frontend/app/report/page.tsx`.

State:

- `step`: 1 upload/analyze, 2 confirm details, 3 success.
- `imageFile`: selected `File`.
- `imagePreview`: local preview data URL.
- `isAnalyzing`: used both for image analysis and final complaint submission.
- `analysis`: AI result.
- `location`, `ward`, `additionalDetails`.
- `latitude`, `longitude`.
- `isGettingLocation`, `locationCaptured`.
- `complaintId`, `copied`.

Step 1:

- User selects or drops image.
- `processImage(file)` rejects files larger than 5 MB and sets `imageFile` plus preview.
- User clicks `Analyze Image`.
- `handleAnalyze()`:
  - If no `imageFile`, returns.
  - Sets `isAnalyzing = true`.
  - Creates `FormData`.
  - Appends `image`.
  - Calls `complaintAPI.analyzeImage(formData)`.
  - Maps snake_case backend fields to local camelCase `analysis`.
  - Sets `step = 2`.
  - Finally sets `isAnalyzing = false`.

Current issue:

- Analyze button is disabled while `isAnalyzing` is true and when no image exists.
- But after success, `isAnalyzing` becomes false.
- Because the UI moves to step 2 this usually prevents repeat clicks, but there is no hard "already analyzed this selected image" lock.
- If user navigates back or events fire oddly, the same image can be analyzed again.
- Desired fix: disable Analyze when `analysis` already exists or add `hasAnalyzed` / `analyzeLocked` state, reset it only when the selected image is removed/replaced.

Step 2:

- User verifies AI result.
- User fills location and ward.
- "Use My Location" calls browser `navigator.geolocation`.
- Reverse geocoding calls OpenStreetMap Nominatim from the browser.
- User submits.
- `handleSubmit()` calls `complaintAPI.create(...)` with image URL, issue type, severity, description, department, location, ward, coordinates, and additional details.
- Success moves to step 3.

Step 3:

- Shows complaint ID.
- Allows copying a generated formal complaint letter.

## Dashboard Flow

File: `frontend/app/dashboard/page.tsx`.

- Protected by middleware.
- On mount, calls `complaintAPI.list(1, 10)`.
- Maps backend complaint fields to local UI shape.
- Displays stats from the fetched list:
  - total
  - submitted
  - in progress
  - resolved
- Supports tabs: all/submitted/progress/resolved.
- Shows table/list and dialog details.

Potential issue:

- Only fetches the first 10 complaints but then computes dashboard stats from that first page. If the user has more than 10 reports, stats can be wrong unless backend returns aggregate stats or all complaints are fetched.

## Community Feed Flow

File: `frontend/app/feed/page.tsx`.

- Protected by middleware.
- On mount, calls `feedAPI.getPosts(1, 12)`.
- Supports "load more".
- Filters loaded posts locally by ward and issue type.
- Displays post image, severity, status, location, ward, citizen name, and relative time.

Important issue reported by user:

- Dashboard to Community sometimes redirects to `/login`, then refresh shows `/feed`.
- Likely causes:
  - Login uses `router.push()` without `router.refresh()`, so middleware/server state can lag after cookie changes.
  - Client header state uses sessionStorage and document.cookie.
  - Backend and frontend use a mixture of httpOnly cookies, frontend-readable cookies, and Authorization headers.

## Admin Dashboard Flow

File: `frontend/app/admin/page.tsx`.

- Protected by middleware using `bmf_admin_token`.
- On mount, calls:
  - `adminAPI.getComplaints({ page: 1, limit: 200 })`
  - `adminAPI.getStats()`
- Maps complaints to local display shape.
- Supports search, filtering, pagination, details dialog, status updates.

Current issues:

- Logout icon is just a `Link href="/"`; it does not call `logoutAdmin()`.
- Header shows hardcoded `Admin User` and `admin@mcgm.gov.in`.
- It fetches up to 200 complaints into client state and filters locally; if there are more than 200 complaints, admin view may be incomplete.

## Admin Creation

File: `backend/create_admin.py`.

Usage:

- Run in backend env: `python create_admin.py`.
- Reads `MONGO_URI`.
- Prompts for name, email, password.
- Inserts admin into `users` collection:
  - `name`
  - `email`
  - `password_hash`
  - `role: "admin"`
  - `created_at`

Admin login uses this same `users` collection and `role: "admin"`.

## Known Current Issues To Fix

1. Admin logout is broken.
   - File: `frontend/app/admin/page.tsx`.
   - The logout icon links to `/` instead of calling `logoutAdmin()`.
   - Result: admin token/session may remain and user cannot cleanly switch to normal login.

2. Login/register/admin login redirects may need refresh.
   - Files:
     - `frontend/app/login/page.tsx`
     - `frontend/app/register/page.tsx`
     - `frontend/app/admin/login/page.tsx`
   - They call `router.push(...)` after auth success.
   - They do not call `router.refresh()`.
   - This causes middleware/server route state to appear stale until manual refresh.

3. Login does not honor redirect query param.
   - Middleware sends users to `/login?redirect=/feed` for protected route access.
   - Login page ignores this and always goes to `/dashboard`.
   - Fix should use `useSearchParams()` and redirect to safe same-origin paths after login.

4. Mixed auth state sources create inconsistent UI/routing.
   - Backend sets httpOnly cookies.
   - Backend also returns JWT in JSON.
   - Frontend stores user/admin info in sessionStorage.
   - Frontend sets JS-readable cookies with the same names (`bmf_token`, `bmf_admin_token`) for middleware.
   - API wrapper reads JS-readable cookies and injects Authorization headers.
   - Middleware reads cookies server-side.
   - Header reads sessionStorage and `document.cookie`.
   - These can disagree during client-side navigation.

5. Backend protected endpoints do not consistently use `verify_token(request)`.
   - Endpoints like `/api/analyze-image` and `/api/complaints` manually require Authorization headers.
   - Fix: standardize user endpoints on `verify_token(request)` so Authorization header and cookie fallback both work.

6. Analyze button needs a stronger once-per-image lock.
   - File: `frontend/app/report/page.tsx`.
   - Add state such as `hasAnalyzed` or use `analysis !== null`.
   - Disable Analyze when no image, currently analyzing, or current image already has analysis.
   - Reset analysis/lock when image is removed/replaced.

7. JWT tokens are returned in JSON despite httpOnly-cookie security comments.
   - Backend auth responses include `token` with comments "Include for debugging".
   - This is why frontend can set a cookie for middleware, but it weakens the intended token handling model.
   - Decide between:
     - Keep returning token for frontend-domain middleware cookie and document security tradeoff.
     - Use a safer architecture such as same-site frontend/backend domain or a server route/proxy that can set frontend-domain httpOnly cookies.

8. TypeScript build errors are ignored.
   - File: `frontend/next.config.mjs`.
   - Contains `typescript: { ignoreBuildErrors: true }`.
   - Direct local `tsc` currently passed when run via local binary, but future errors could ship.

9. Lint script is broken.
   - File: `frontend/package.json`.
   - `lint` script is `eslint .`.
   - `eslint` is not installed, so `pnpm lint` fails.

10. Next 16 middleware deprecation warning.
   - Build warns that the `middleware` file convention is deprecated and should use `proxy`.

11. Google Fonts build dependency.
   - File: `frontend/app/layout.tsx`.
   - Uses `next/font/google` for Montserrat, Merriweather, and Source Code Pro.
   - Build failed in restricted network environment, passed with network access.
   - Consider local fonts if CI/deploy environment cannot fetch Google Fonts.

12. Backend exposes raw exception strings in responses.
   - Many `except Exception as e` blocks return `str(e)` to client.
   - This can expose implementation details.

13. Rate limiting trusts raw `X-Forwarded-For`.
   - File: `backend/app.py`.
   - Can be spoofed unless a trusted proxy sanitizes it.

14. Root README is placeholder.

## Suggested Fix Order

1. Fix admin logout:
   - Import `logoutAdmin` in `frontend/app/admin/page.tsx`.
   - Replace `Link href="/"` logout icon with a button that calls `await logoutAdmin()`.

2. Fix login redirect refresh behavior:
   - In user login/register/admin login pages, replace `router.push(...)` with a flow that refreshes route state:
     - `router.replace(target)`
     - `router.refresh()`
   - Or use a full navigation if needed.
   - In login page, read `redirect` query param and send user back to that path after success.

3. Standardize backend auth:
   - Replace repeated Authorization-only blocks in user endpoints with `user_id = verify_token(request)`.
   - Keep `verify_admin(request)` for admin routes.

4. Decide token/cookie architecture:
   - Short-term: keep frontend-domain middleware cookies and make all login/logout flows update them consistently.
   - Longer-term: avoid exposing JWT to JS by serving frontend and backend under same site or using a Next route to set httpOnly frontend-domain cookies.

5. Add analyze-once lock:
   - Disable Analyze when `analysis` exists for current image.
   - Reset analysis and lock when image is removed/replaced.

6. Add regression tests/manual verification:
   - Admin login -> admin page -> admin logout -> user login.
   - User login on mobile -> dashboard immediately without refresh.
   - Dashboard -> Community feed without login redirect.
   - Direct `/feed` logged out -> `/login?redirect=/feed`, then login -> `/feed`.
   - Analyze Image can only be submitted once per selected image.

## Commands And Checks

Frontend:

- Dev: `pnpm dev` from `frontend/`.
- Build: `pnpm build` from `frontend/`.
- Type check directly: `.\node_modules\.bin\tsc.CMD --noEmit` from `frontend/` on Windows.
- Lint currently fails because `eslint` is not installed.

Backend:

- Run Flask dev server from `backend/` after env is configured: `python app.py`.
- Compile check: `python -m py_compile app.py create_admin.py test_gemini.py`.
- Production start from `backend/render.yaml`: `gunicorn app:app`.

## Deployment Notes

Backend Render config:

- File: `backend/render.yaml`.
- Build command: `pip install -r requirements.txt`.
- Start command: `gunicorn app:app`.
- Required env vars are listed in `render.yaml`.

Frontend Vercel-like config:

- File: `frontend/vercel.json`.
- Ensure `NEXT_PUBLIC_API_URL` points to deployed backend.
- Ensure `JWT_SECRET` matches backend.

## Important Source Files For AI To Read First

Read these in order before editing:

1. `frontend/middleware.ts`
2. `frontend/lib/auth.ts`
3. `frontend/lib/api.ts`
4. `frontend/app/login/page.tsx`
5. `frontend/app/register/page.tsx`
6. `frontend/app/admin/login/page.tsx`
7. `frontend/app/admin/page.tsx`
8. `frontend/components/landing/header.tsx`
9. `frontend/app/report/page.tsx`
10. `backend/app.py` auth helpers and route sections

## Current User-Reported Bugs

The user reported:

- "If I login as admin I can't logout and login as user again."
- "Once I login as user on mobile it still shows login page; I have to refresh to see dashboard."
- "On desktop and mobile, when I am on dashboard and go to community, it shows login page again; after refresh it shows community page."
- "When uploading an image to report an issue, Analyze button should work only once if image is present and then lock down so users cannot submit analyze again and again."

These reports match the code issues listed above.
