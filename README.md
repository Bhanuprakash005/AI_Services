# AI Consulting Service Landing Page

A production-ready, single-page AI Consulting Service landing page with a fully functional contact form backend.

## Project Structure

```
.
├── backend/
│   ├── server.js          # Express server with contact API
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── styles.css         # All CSS styles
│   └── script.js          # Frontend JavaScript
└── README.md              # This file
```

## Features

- **Modern, Responsive Design**: Fully responsive layout that works on all devices
- **Hero Section**: Eye-catching hero with value proposition and CTAs
- **Services Section**: 5 AI consulting services with icons
- **Why Choose Us**: 6 value propositions
- **Contact Form**: Functional contact form with backend integration
- **Email Integration**: Backend sends the message to your business inbox + auto-replies to the user via Nodemailer
- **Error Handling**: Comprehensive error handling on both frontend and backend

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- An email account with SMTP access (Gmail, Outlook, etc.)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your email credentials:

For Gmail:
- Use an **App Password** (recommended)
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=middebhanuprakash123@gmail.com`
- `SMTP_PASS=your-app-password`
- `SMTP_FROM=middebhanuprakash123@gmail.com`
- `CONTACT_EMAIL=middebhanuprakash123@gmail.com` (where submissions are delivered)

For other providers, adjust the SMTP settings accordingly.

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Open `index.html` in a browser, or use a local server:

Using Python:
```bash
python -m http.server 8000
```

If Python isn't installed, use the included Node static server:
```bash
node static-server.js
```

Using Node.js (http-server):
```bash
npx http-server -p 8000
```

3. Update API URL in `script.js` if needed:
   - For local development: `http://localhost:3000/api`
   - For production: Update to your backend URL

4. Open `http://localhost:8000` in your browser

## Deployment

### Backend Deployment (Render/Railway)

1. Push your code to GitHub
2. **Render**: New → **Web Service** → select your repo
3. Set **Root Directory** to `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Set environment variables in Render dashboard (see below)
7. Deploy and copy the Render service URL (example: `https://your-service.onrender.com`)

**Environment Variables to Set:**
- `PORT` (usually auto-set by platform)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `CONTACT_EMAIL`
- `MONGODB_URI`
- `MONGODB_DB` (optional)

### Frontend Deployment (Netlify/Vercel)

1. Push your code to GitHub
2. **Vercel**: New Project → import repo
3. Set **Root Directory** to `frontend`
4. Edit `frontend/vercel.json` and replace `https://YOUR_RENDER_BACKEND_URL` with your Render backend URL
5. Deploy

## API Endpoints

### POST `/api/contact`

Submit a contact form message.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'm interested in your services."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "confirmationEmailSent": true,
  "message": "Thanks! Your message was sent. Please check your inbox for a confirmation email."
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET `/api/health`

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Email**: Nodemailer
- **Fonts**: Google Fonts (Inter)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
# AI_Services
