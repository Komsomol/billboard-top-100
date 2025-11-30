# Billboard Charts Frontend

Vue 3 + Vite frontend for displaying Billboard chart data with YouTube music video integration.

## Features

- Browse Billboard Hot 100 and other popular charts
- View chart data for any date
- Watch official music videos directly in the app
- Responsive design for mobile and desktop

## Project Structure

```
frontend/
├── server/
│   └── index.js              # Express API server
├── src/
│   ├── components/
│   │   ├── ChartSelector.vue # Chart/date selection
│   │   ├── SongCard.vue      # Individual song display
│   │   ├── SongList.vue      # Songs grid
│   │   ├── LoadingState.vue  # Loading indicator
│   │   └── ErrorState.vue    # Error display
│   ├── composables/
│   │   └── useChart.js       # Chart state management
│   ├── services/
│   │   ├── billboard.js      # Billboard API client
│   │   └── youtube.js        # YouTube API client
│   ├── App.vue               # Root component
│   └── main.js               # App entry point
├── .env                      # Environment variables
├── vite.config.js            # Vite configuration
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_YOUTUBE_API_KEY=your_youtube_api_key
PORT=3001
```

3. Run development server:
```bash
npm run dev
```

This starts both:
- Express API server on http://localhost:3001
- Vite dev server on http://localhost:5173

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers concurrently |
| `npm run dev:client` | Start Vite dev server only |
| `npm run dev:server` | Start Express API server only |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/charts` | List all available charts |
| `GET /api/chart` | Get Hot 100 (current week) |
| `GET /api/chart/:name` | Get specific chart |
| `GET /api/chart/:name?date=YYYY-MM-DD` | Get chart for specific date |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `PORT` | Express server port (default: 3001) |
