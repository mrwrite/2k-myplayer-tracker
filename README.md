# 2K MyPLAYER Tracker

2K MyPLAYER Tracker is a lightweight web app for manually tracking NBA 2K MyPLAYER builds over time.

## Functionality

- Create, edit, and delete builds with position, body settings, and attributes.
- View all saved builds and manage them from a list.
- Compare two builds side by side with a table and radar chart.
- Export builds as JSON and import them later.
- Data persists locally using `localStorage`; no backend setup is required.

## Authentication

Sign in with Google is required to use the app. Create a Google OAuth client and set the client ID in a `.env` file:

```
cp .env.example .env
# edit .env and set VITE_GOOGLE_CLIENT_ID
```

The development and production builds will use this client ID for Google authentication.

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
