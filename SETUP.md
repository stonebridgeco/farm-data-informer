# Farm Data Informer - Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Git

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys  
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# USDA NASS API (Optional - has rate limits without key)
VITE_USDA_NASS_API_KEY=your_usda_nass_api_key

# USDA APIs (typically no key required)
VITE_USDA_NASS_API_URL=https://quickstats.nass.usda.gov/api
VITE_USDA_SOIL_API_URL=https://sdmdataaccess.sc.egov.usda.gov

# NOAA API
VITE_NOAA_API_URL=https://www.ncdc.noaa.gov/cdo-web/api/v2

# USGS Elevation API
VITE_USGS_ELEVATION_API_URL=https://nationalmap.gov/epqs
```

### 3. Third-party Service Setup

#### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env.local`

#### Mapbox Setup (Optional)
1. Create account at [mapbox.com](https://mapbox.com)
2. Get your access token (free tier: 50k requests/month)
3. Add to `.env.local`

#### OpenWeather API Setup
1. Create account at [openweathermap.org](https://openweathermap.org)
2. Get your free API key
3. Add to `.env.local`

### 4. Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## API Documentation

### USDA NASS API
- **URL**: https://quickstats.nass.usda.gov/api
- **Documentation**: https://quickstats.nass.usda.gov/api
- **Rate Limit**: No authentication required for basic queries

### USDA Web Soil Survey API
- **URL**: https://sdmdataaccess.sc.egov.usda.gov
- **Documentation**: https://sdmdataaccess.sc.egov.usda.gov/WebServiceHelp.aspx
- **Authentication**: None required

### OpenWeather API
- **URL**: https://api.openweathermap.org/data/2.5
- **Documentation**: https://openweathermap.org/api
- **Rate Limit**: 1,000 calls/day (free tier)

### USGS Elevation API
- **URL**: https://nationalmap.gov/epqs
- **Documentation**: https://nationalmap.gov/epqs
- **Authentication**: None required

## Project Structure

```
src/
├── components/         # React components
├── hooks/             # Custom React hooks
├── services/          # API service functions
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── styles/            # CSS and Tailwind styles
└── App.tsx           # Main application component
```

## Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## Free Tier Limits

- **Supabase**: 500MB database, 50MB file storage, 2GB bandwidth
- **Vercel**: 100GB bandwidth, unlimited personal projects
- **Mapbox**: 50,000 map loads/month
- **OpenWeather**: 1,000 API calls/day
- **USDA/USGS APIs**: No limits for basic usage
