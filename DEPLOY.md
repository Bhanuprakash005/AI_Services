# Deploy to Render + Vercel

Do **Step 1 (Render)** first, then **Step 2 (Vercel)** and use your Render URL when asked.

---

## Step 1 — Deploy backend on Render

1. Go to **[render.com](https://render.com)** and sign in (or create an account).
2. Click **New** → **Web Service**.
3. Connect your GitHub account if needed, then select the repo **Bhanuprakash005/AI_Services**.
4. Render may auto-detect `render.yaml`. If so, confirm:
   - **Name:** ai-consulting-backend (or any name)
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free (or paid)
5. Under **Environment**, add these variables (use your real values; never commit them):

   | Key | Value |
   |-----|--------|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` |
   | `SMTP_USER` | your Gmail (e.g. middebhanuprakash123@gmail.com) |
   | `SMTP_PASS` | your Gmail App Password |
   | `SMTP_FROM` | same as SMTP_USER |
   | `CONTACT_EMAIL` | same as SMTP_USER |
   | `MONGODB_URI` | your MongoDB Atlas connection string |
   | `MONGODB_DB` | (optional) e.g. `1` |

6. Click **Create Web Service** and wait for the first deploy to finish.
7. Copy your backend URL, e.g. **`https://ai-consulting-backend-xxxx.onrender.com`** — you need this for Step 2.

---

## Step 2 — Deploy frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (or create an account).
2. Click **Add New** → **Project**.
3. Import the repo **Bhanuprakash005/AI_Services**.
4. Configure the project:
   - **Root Directory:** click **Edit**, set to **`frontend`**.
   - **Build Command:** `npm run build` (runs automatically via vercel.json).
   - **Output Directory:** leave default (`.`).
5. (Optional) Add env var **`PUBLIC_API_URL`** = your Render backend URL (e.g. `https://ai-services-xkpq.onrender.com`) to override the default.
6. Click **Deploy** and wait for the build to finish.
7. Your site will be at a URL like **`https://ai-services-xxxx.vercel.app`**.

---

## After deploy

- **Frontend:** The contact form calls the Render backend URL directly (no Vercel proxy). Requests go from the browser to `https://ai-services-xkpq.onrender.com/api/contact`.
- **Backend:** Your Render URL serves the API.

If the form fails, check:
- Render dashboard: logs and env vars (especially SMTP and MONGODB_URI).
- CORS: backend has `cors()` enabled and allows your Vercel domain.
