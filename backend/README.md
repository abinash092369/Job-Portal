# Job Portal Backend API

Production-ready backend API service for the Job Portal web application built with **Node.js**, **Express**, **TypeScript**, **MongoDB + Mongoose**, **JWT Auth**, **Zod**, **Multer + Cloudinary**, **Nodemailer**, and **Winston**.

---

## Response Envelope Standard

Every API endpoint strictly returns a standardized response envelope:

```json
{
  "success": boolean,
  "data": <payload or null>,
  "message": "Optional message string"
}
```

---

## Railway Deployment Guide

### Step 1: Set Railway Environment Variables

Railway does **NOT** read `.env` files committed to Git. You **MUST** manually add the following environment variables in your Railway Project Dashboard (`Settings` -> `Variables`):

| Variable Name | Required Value / Description | Example |
| --- | --- | --- |
| `PORT` | Set automatically by Railway (or default `5000`) | `5000` |
| `NODE_ENV` | Must be set to `production` | `production` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/job-portal?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | `production_access_secret_987654321` |
| `JWT_ACCESS_EXPIRY` | Access token lifespan | `15m` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | `production_refresh_secret_123456789` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifespan | `7d` |
| `FRONTEND_URL` | Deployed Frontend URL (no trailing slash) | `https://job-portal-abinash.netlify.app` |
| `BACKEND_PUBLIC_URL` | Your Railway public URL (no trailing slash) | `https://job-portal-backend-production.up.railway.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name (optional) | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key (optional) | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret (optional) | `secret_key` |
| `SMTP_HOST` | Nodemailer Host (optional) | `smtp.mailtrap.io` |
| `SMTP_PORT` | Nodemailer Port (optional) | `587` |
| `SMTP_USER` | Nodemailer User (optional) | `smtp_username` |
| `SMTP_PASS` | Nodemailer Password (optional) | `smtp_password` |
| `SMTP_FROM` | Email sender address | `"Job Portal <noreply@jobportal.com>"` |

> [!IMPORTANT]
> **Cross-Site Cookie Notice**: Netlify and Railway run on different domains. In production (`NODE_ENV=production`), refresh cookies are configured with `sameSite: 'none'` and `secure: true`. Ensure `FRONTEND_URL` is set to `https://job-portal-abinash.netlify.app` (without trailing slashes) so browser cross-origin credentials succeed.

---

### Step 2: Configure Netlify Frontend Environment Variable

After Railway deploys your backend and provides a public domain (e.g., `https://job-portal-backend-production.up.railway.app`), update your frontend configuration:

1. In the **Netlify Dashboard** -> **Site settings** -> **Environment variables**:
   Set `VITE_API_URL` to:
   ```env
   VITE_API_URL=https://job-portal-backend-production.up.railway.app/api/v1
   ```
2. Trigger a re-deploy of your Netlify site.

---

## Local Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally on port 27017 or MongoDB Atlas)

### Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed database with test data:
   ```bash
   npm run seed
   ```

3. Run in Development Mode:
   ```bash
   npm run dev
   ```

4. Build & Run Production Bundle:
   ```bash
   npm run build
   npm start
   ```

---

## Swagger API Documentation

Access live interactive Swagger OpenAPI documentation at:
- `http://localhost:5000/docs`
- `http://localhost:5000/api/v1/docs`

---

## Security Audit Notice

> [!CAUTION]
> If any `.env` file containing sensitive credentials was previously committed to git history, rotate those secrets immediately (JWT signing keys, DB password, SMTP credentials, Cloudinary secrets) as gitignoring a file does not remove historical commits.
