# Notes Vibes App - Local Setup Guide

This README will guide you through setting up the Notes Vibes application on your local machine.

## Download Instructions

### Option 1: Using Replit's Export Feature

1. In the Replit environment, click on the "three dots" menu (⋮) in the top-right corner.
2. Select "Export Repl" or "Download as Zip" option.
3. The complete project will be downloaded as a ZIP file.

### Option 2: Manual Download (If Export Isn't Working)

If you're having trouble with the export feature, you can manually copy the necessary files:

1. Create a new folder on your computer for the project
2. Copy the following files and folders from Replit to your local folder:
   - `client/`
   - `db/`
   - `server/`
   - `shared/`
   - `package.json`
   - `tsconfig.json`
   - `vite.config.ts`
   - `drizzle.config.ts`
   - `postcss.config.js`
   - `tailwind.config.ts`
   - `components.json`
   - `download/local-setup.js` (rename to `setup.js` in your local folder)

## Setting Up the Application

1. Make sure you have the following installed:
   - Node.js 18 or later
   - PostgreSQL database
   - npm (comes with Node.js)

2. Navigate to the project folder in your terminal/command prompt:
   ```bash
   cd path/to/project/folder
   ```

3. Run the setup script:
   ```bash
   node setup.js
   ```
   
   This script will:
   - Ask for your PostgreSQL connection details
   - Create a `.env` file with your database configuration
   - Install all dependencies
   - Set up the database schema
   - Seed the database with initial data

4. After the setup is complete, start the application:
   ```bash
   npm run dev
   ```

5. Open your browser and go to `http://localhost:5000`

6. Log in with the demo account:
   - Username: `demo`
   - Password: `password`

## Features

- User authentication (login, register, profile)
- Note management (create, edit, delete)
- Todo lists
- Quick notes
- Tag organization
- Spotify integration (requires Spotify API credentials)
- Dark/light theme

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that PostgreSQL is running
2. Verify the connection details in your `.env` file
3. Make sure your PostgreSQL user has the necessary permissions

### Port Already in Use

If port 5000 is already in use:

1. Edit `server/index.ts` to change the port number
2. Restart the application

### Missing Dependencies

If you see errors about missing dependencies:

```bash
npm install
```

## Technology Stack

- Frontend: React, Tailwind CSS, Shadcn UI components
- Backend: Node.js, Express
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js with session-based auth
- API: REST endpoints with proper validation

## License

This project is for educational purposes only.