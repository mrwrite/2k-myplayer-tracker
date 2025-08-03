# 2K MyPLAYER Tracker

2K MyPLAYER Tracker is a lightweight web app for manually tracking NBA 2K MyPLAYER builds over time.

## Functionality

- Create, edit, and delete builds with position, body settings, and attributes.
- View all saved builds and manage them from a list.
- Compare two builds side by side with a table and radar chart.
- Export builds as JSON and import them later.
- Data persists locally using `localStorage`; no backend setup is required.
- Upload a box-score screenshot to extract and persist game stats in Firebase.

## Authentication

Sign in with Google is required to use the app. Create a Google OAuth client and set the client ID in a `.env` file:

```
cp .env.example .env
# edit .env and set VITE_GOOGLE_CLIENT_ID
```

The development and production builds will use this client ID for Google authentication.

## Firebase Configuration

This project uses Firebase for storing screenshots and game stats. Copy the example environment file and supply your Firebase settings:

```
cp .env.example .env
# edit .env with your Firebase credentials
```

Enable Firestore and Storage in your Firebase project before running the app.

## Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   This boots a Vite dev server (default: http://localhost:5173) where the app will be available.

### OCR Backend

An optional FastAPI server is included for parsing box score screenshots with Tesseract.

1. **Install system dependency**

   Install the Tesseract binary if it is not already available:

   ```bash
   sudo apt-get update && sudo apt-get install tesseract-ocr
   ```

2. **Install Python dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the API**

   ```bash
   uvicorn main:app --reload
   ```

   Send a `POST` request to `http://localhost:8000/parse-boxscore?username=AUSWEN` with a PNG or JPEG file field named `file` to receive parsed stats.

## Build for Production

```bash
npm run build
```

Use `npm run preview` to locally serve the production build.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS for styling
- React Router for navigation
- Chart.js via `react-chartjs-2` for comparison charts
