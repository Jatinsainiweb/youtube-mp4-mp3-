# YouTube MP4 Converter Backend

This is the backend server for the YouTube MP4 Converter website. It provides APIs for page navigation, FAQs, and contact form submissions.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Then update the environment variables in `.env` as needed.

3. Start the server:
   ```bash
   npm start
   ```

For development with auto-reload:
```bash
npm run dev
```

## Deployment to Render

1. Create a new Web Service on Render:
   - Go to https://dashboard.render.com
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. Configure the Web Service:
   - Name: youtube-converter-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free (or paid if needed)

3. Add Environment Variables:
   - PORT: 3003
   - NODE_ENV: production
   - CORS_ORIGIN: Your frontend domain (e.g., https://your-frontend-domain.com)

4. Deploy:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/pages` - Get list of HTML pages
- `GET /api/faqs` - Get FAQ list
- `POST /api/contact` - Submit contact form

## Environment Variables

- `PORT` - Server port (default: 3003)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed frontend origin for CORS
