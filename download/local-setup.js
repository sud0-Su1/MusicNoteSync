#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Log helper function
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute command helper function
function execute(command, options = {}) {
  try {
    log(`> ${command}`, colors.blue);
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    if (options.ignoreError) {
      log(`Command failed but continuing: ${error.message}`, colors.yellow);
      return null;
    }
    log(`Error executing command: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Get database connection details
function getDatabaseConfig() {
  return new Promise((resolve) => {
    log('\nLet\'s set up your database connection', colors.green);
    rl.question('PostgreSQL username (default: postgres): ', (username) => {
      rl.question('PostgreSQL password: ', (password) => {
        rl.question('PostgreSQL host (default: localhost): ', (host) => {
          rl.question('PostgreSQL port (default: 5432): ', (port) => {
            rl.question('Database name (default: notes_vibes_db): ', (dbName) => {
              resolve({
                username: username || 'postgres',
                password: password || '',
                host: host || 'localhost',
                port: port || '5432',
                dbName: dbName || 'notes_vibes_db'
              });
            });
          });
        });
      });
    });
  });
}

// Check if npm is installed
function checkNpm() {
  try {
    execSync('npm --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if node is installed
function checkNode() {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  log('\n=== Notes Vibes App Setup ===', colors.green);
  
  // Check Node.js and npm
  log('\nChecking prerequisites...', colors.blue);
  
  if (!checkNode()) {
    log('Node.js is not installed. Please install Node.js 18 or later.', colors.red);
    process.exit(1);
  }
  
  if (!checkNpm()) {
    log('npm is not installed. Please install npm.', colors.red);
    process.exit(1);
  }
  
  log('Node.js and npm are installed ✓', colors.green);
  
  // Get database configuration
  const dbConfig = await getDatabaseConfig();
  
  // Create .env file
  log('\nCreating .env file...', colors.blue);
  const envContent = `DATABASE_URL=postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}
SESSION_SECRET=notes-vibes-app-secret
`;
  fs.writeFileSync('.env', envContent);
  log('.env file created ✓', colors.green);
  
  // Install dependencies
  log('\nInstalling dependencies...', colors.blue);
  execute('npm install');
  log('Dependencies installed ✓', colors.green);
  
  // Set up database
  log('\nSetting up database...', colors.blue);
  try {
    log('Pushing database schema...');
    execute('npm run db:push');
    log('Database schema created ✓', colors.green);
    
    log('Seeding database...');
    execute('npm run db:seed');
    log('Database seeded ✓', colors.green);
  } catch (error) {
    log(`Error setting up database: ${error.message}`, colors.red);
    log('Please check your database connection and try again.', colors.yellow);
    process.exit(1);
  }
  
  // Success
  log('\n=== Setup completed successfully! ===', colors.green);
  log('\nYou can now start the application with:', colors.blue);
  log('npm run dev', colors.yellow);
  log('\nOpen http://localhost:5000 in your browser to access the app.', colors.blue);
  log('\nLogin credentials:', colors.blue);
  log('Username: demo', colors.yellow);
  log('Password: password', colors.yellow);
  
  rl.close();
}

// Run main function
main().catch(error => {
  log(`An error occurred during setup: ${error.message}`, colors.red);
  process.exit(1);
});