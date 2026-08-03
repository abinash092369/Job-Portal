# Job Board Backend SaaS

A production-grade, extensible Node.js, Express, and TypeScript backend SaaS API for a Job Board application.

---

## Technical Stack
- **Runtime & Language**: Node.js, TypeScript
- **Framework**: Express.js
- **Security**: Helmet, CORS (configured with non-wildcard options), Express-Rate-Limit (global controls + stricter search limits)
- **Validation**: Zod (validated incoming `body`, `query`, and `params` schemas via reusable validation middlewares)
- **Logging**: Winston logger (morgan streaming HTTP requests to Winston)
- **Authentication**: bcrypt password hashing (10 rounds), JWT access tokens (15m, short-lived), secure `httpOnly` rotated refresh tokens (7d, long-lived)
- **Email Service**: Nodemailer (with template-based emails and dynamic Ethereal SMTP fallback for local development testing)
- **Documentation**: Swagger OpenAPI UI (accessible out-of-the-box)

---

## Folder Architecture

```text
JobPortal/
└── backend/
    ├── src/
    │   ├── config/             # Config variables, env parsing & uploads settings
    │   │   ├── env.ts          # Zod-validated environment configurations
    │   │   └── upload.ts       # Multer configuration for resumes, photos, and logos
    │   ├── types/              # Domain interfaces & TypeScript type declarations
    │   │   ├── auth.ts         # User profiles, refresh token payloads
    │   │   ├── profile.ts      # Candidate and Employer profile interfaces
    │   │   ├── job.ts          # Job status, type, search arguments
    │   │   ├── application.ts  # Job application, screening questions, status enums
    │   │   ├── bookmark.ts     # Job save and bookmark relationships
    │   │   ├── notification.ts # In-app notification interfaces
    │   │   ├── dashboard.ts    # Dashboard aggregation payloads
    │   │   └── express.d.ts    # Express namespace extensions for req.user
    │   ├── repositories/       # Data-access layer defining interfaces and in-memory stores
    │   │   ├── user.repository.ts
    │   │   ├── token.repository.ts
    │   │   ├── profile.repository.ts
    │   │   ├── job.repository.ts
    │   │   ├── application.repository.ts
    │   │   ├── bookmark.repository.ts
    │   │   ├── notification.repository.ts
    │   │   └── in-memory/      # Singleton in-memory repository implementations
    │   ├── services/           # Business logic & services (Nodemailer, tokens, logic)
    │   │   ├── auth.service.ts
    │   │   ├── profile.service.ts
    │   │   ├── job.service.ts
    │   │   ├── application.service.ts
    │   │   ├── bookmark.service.ts
    │   │   ├── notification.service.ts
    │   │   ├── dashboard.service.ts
    │   │   ├── email.service.ts
    │   │   └── admin.service.ts
    │   ├── controllers/        # Request controllers mapping data payloads
    │   │   ├── auth.controller.ts
    │   │   ├── profile.controller.ts
    │   │   ├── job.controller.ts
    │   │   ├── application.controller.ts
    │   │   ├── bookmark.controller.ts
    │   │   ├── notification.controller.ts
    │   │   ├── dashboard.controller.ts
    │   │   └── admin.controller.ts
    │   ├── middlewares/        # Filters (auth guards, role guards, validator, errors)
    │   │   ├── auth.middleware.ts  # Token verification & request mapping
    │   │   ├── role.middleware.ts  # RBAC authorization filters
    │   │   ├── validator.middleware.ts # Zod validator schema matching
    │   │   ├── rateLimiter.ts      # Global and search rate limit rules
    │   │   └── errorHandler.ts     # Global central error parser
    │   ├── routes/             # Routes registration, validations, and Swagger UI
    │   │   ├── index.ts        # Top-level API endpoints routing setup
    │   │   └── swagger.ts      # OpenAPI specification and UI serving
    │   ├── utils/              # Helper utilities (custom HTTP errors, standard formatters)
    │   ├── app.ts              # Express application creation & pipeline registration
    │   └── server.ts           # HTTP server startup & graceful shutdown handlers
    ├── JobPortal.postman_collection.json # Exported Postman collection
    ├── tsconfig.json           # TypeScript compilation settings
    └── package.json            # Run scripts and package dependencies
```

---

## Data Layer (MongoDB & Mongoose)

This application has been connected to a production-ready **MongoDB** database using **Mongoose ODM**. The repository pattern preserves the clean decoupling of controllers and services, replacing the in-memory implementations with Mongoose repositories without changing any controller or business service code.

---

## Database Setup & Configuration

### 1. Local MongoDB via Docker Compose
To run MongoDB locally using Docker:
1. Make sure Docker and Docker Compose are installed on your system.
2. From the project root directory, run:
   ```bash
   docker compose up -d
   ```
   This spins up a MongoDB container on `mongodb://localhost:27017/jobportal` with persistent volume storage.

### 2. MongoDB Atlas (Cloud Production)
For production deployments (e.g. Atlas):
1. Create a free-tier database cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Whitelist your server's IP address.
3. Retrieve your MongoDB Connection String (URI).
4. Update the `MONGODB_URI` environment variable in your `.env` file to match this connection string.

### 3. Database Seeding
To seed the database immediately with mock data (creates 2 admin users, 5 employer accounts + profiles, 15 candidate accounts + profiles, 20 sample jobs, and a mix of applications):
```bash
# Seed the database
npx tsx src/seed.ts
```
*Note: All seed accounts use the default password `Password123!`. Hashing is optimized to pre-compute once, meaning the seed script runs in seconds.*

### 4. Database Backups
- **Atlas Automated Backups**: If using MongoDB Atlas, enable automated backup snapshots in the cluster settings (continuous backup or cloud snapshots).
- **Manual Backups (mongodump)**:
  To perform a manual database backup:
  ```bash
  mongodump --uri="your_mongodb_connection_uri" --out=/path/to/backup/directory
  ```
  To restore a backup:
  ```bash
  mongorestore --uri="your_mongodb_connection_uri" --dir=/path/to/backup/directory
  ```

---

## Getting Started

### 1. Installation
Install the project dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example` for details). If not provided, dynamic test configurations and ethereal SMTP fallbacks are configured.

### 3. Running in Development
Start the dev server:
```bash
npm run dev
```
The server will run on port `5000` (e.g. `http://localhost:5000`).

### 4. Compiling & Production Launch
Build the TypeScript source files:
```bash
npm run build
```
Run the compiled JavaScript output:
```bash
npm run start
```

---

## API & Documentation

Once the server is running, the following endpoints are available:
- **Swagger Docs URL**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **Health Check Endpoint**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## Complete API Endpoint Directory

All routes are prefixed with `/api/v1`.

### 1. System
- `GET /health` - Public API health check.

### 2. Authentication (`/auth`)
- `POST /register` - Register a candidate or employer.
- `GET /verify-email` - Complete email verification via token.
- `POST /login` - Log in with credentials (returns access token and sets long-lived secure refresh cookie).
- `POST /refresh-token` - Retrieve a new access token using the refresh token.
- `POST /forgot-password` - Request a password reset email.
- `POST /reset-password` - Complete password reset using token.
- `GET /me` - Get current authenticated user details.
- `POST /logout` - Clear user session and cookies.

### 3. Profile Management (`/profile`)
- `GET /` - Retrieve the profile of the current authenticated user.
- `PUT /candidate` - Update candidate profile details.
- `PUT /employer` - Update employer profile details.
- `POST /resume` - Upload a resume file (max 5MB, PDF/DOC/DOCX).
- `POST /photo` - Upload a candidate profile photo (max 5MB, JPG/PNG).
- `POST /logo` - Upload an employer company logo (max 5MB, JPG/PNG).

### 4. Jobs (`/jobs`)
- `GET /` - Public search and paginated job listing (filters: location, remote, salary, type, experience, skills, sorted by relevance/newest). Rate-limited.
- `GET /:id` - Retrieve a single job posting by ID (increments views).
- `POST /` - Create a job posting (Employer only, starts in `draft`).
- `PUT /:id` - Edit a job posting (Employer only, ownership-guarded).
- `DELETE /:id` - Delete a job posting (Employer only, ownership-guarded).
- `PATCH /:id/publish` - Publish a job posting (Employer only).
- `PATCH /:id/unpublish` - Unpublish a job posting (Employer only).
- `POST /expire-check` - Scan and auto-expire past-deadline jobs (Employer/Admin only).
- `POST /:jobId/save` - Bookmark/save a job posting (Candidate only).
- `POST /:jobId/unsave` - Remove job posting bookmark (Candidate only).
- `GET /saved` - List all bookmarked jobs (Candidate only).
- `GET /my-jobs` - List all job postings created by the employer (Employer only).

### 5. Applications (`/applications` & `/jobs/:jobId`)
- `POST /jobs/:jobId/apply` - Submit a job application (Candidate only, validates custom screening questions, uploads resume).
- `GET /jobs/:jobId/applications` - List applicants for a job posting (Employer only).
- `PATCH /applications/:id/status` - Update candidate application status (Employer only, triggers HTML template email notification).
- `POST /applications/:id/notes` - Add private feedback notes on an applicant (Employer only).

### 6. Dashboards (`/dashboard`)
- `GET /employer` - Aggregates active jobs count, total applicants, applicants per job, and recent activities (Employer only).
- `GET /candidate` - Lists applied postings with status history, bookmarks list, and computes profile completeness % (Candidate only).

### 7. Notifications (`/notifications`)
- `GET /` - Retrieve all in-app notifications (application received, status update, job expiring soon).
- `PATCH /read-all` - Mark all notifications as read.
- `PATCH /:id/read` - Mark a single notification as read.

### 8. Administration (`/admin`)
- `GET /users` - List all users with passwords omitted (Admin only).
- `PATCH /users/:id/suspend` - Suspend or unsuspend any user account (Admin only).
- `PATCH /employers/:id/verify` - Approve/reject employer verification badges (Admin only).
- `PATCH /jobs/:id/status` - Override status of any job posting (Admin only).
- `DELETE /jobs/:id` - Force delete any job posting (Admin only).
- `GET /stats` - Aggregated platform-wide metrics (total users, roles breakdown, total jobs, total applications) (Admin only).
