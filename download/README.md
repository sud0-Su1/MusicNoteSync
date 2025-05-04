# Notes Vibes App

An aesthetic notes app with todo lists, page organization, and Spotify integration featuring a vinyl player visualization.

## Features

- 🎨 Modern UI with dark/light theme support
- 📝 Different note types: Regular notes, To-do lists, and Quick notes
- 🎵 Spotify integration with vinyl record visualization
- 🏷️ Tag system for organization
- 📱 Responsive design for all devices

## Local Installation Guide

### Prerequisites

- Node.js (version 18.x or later)
- PostgreSQL database
- npm (or yarn)

### Step 1: Clone and Install Dependencies

```bash
# Extract the downloaded tar.gz file
tar -xzf notes-vibes-app.tar.gz
cd notes-vibes-app

# Install dependencies
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file with your database and Spotify credentials
```

Make sure to update the `.env` file with:
- Your PostgreSQL connection details
- Spotify API credentials (if you want to use the music features)

### Step 3: Set Up the Database

```bash
# Create PostgreSQL database
createdb notes_vibes_db

# Push schema to database
npm run db:push

# Seed the database with initial data
npm run db:seed
```

### Step 4: Start the Application

```bash
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000)

### Demo Login

Use these credentials to log in:
- Username: `demo`
- Password: `password`

## Spotify Integration Setup

To use the Spotify integration:

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Set the redirect URI to `http://localhost:5000/api/spotify/callback`
3. Add your Spotify credentials to the `.env` file:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

## Technology Stack

- Frontend: React, TailwindCSS, Shadcn UI
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js with local strategy
- Music API: Spotify Web API

## License

This project is licensed under the MIT License - see the LICENSE file for details.