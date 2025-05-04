#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a shell command and log output
function execute(command, options = {}) {
  log(`\n▶ Executing: ${command}\n`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    if (!options.ignoreError) {
      log(`\n❌ Error executing command: ${command}`, colors.red);
      if (error.message) log(error.message, colors.red);
    }
    return false;
  }
}

// Environment setup
function setupEnvironment() {
  log('\n📝 Setting up environment...', colors.bright);
  
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      log('✅ Created .env file from .env.example', colors.green);
      log('⚠️ Please edit the .env file with your database and Spotify credentials!', colors.yellow);
    } else {
      log('❌ Could not find .env.example file. Please create a .env file manually.', colors.red);
    }
  } else {
    log('✅ .env file already exists', colors.green);
  }
}

// Install dependencies
function installDependencies() {
  log('\n📦 Installing dependencies...', colors.bright);
  return execute('npm install');
}

// Setup database
function setupDatabase() {
  log('\n🗄️ Setting up database...', colors.bright);
  log('⚠️ Make sure your PostgreSQL server is running and credentials are correct in .env file', colors.yellow);

  // Run database migrations
  log('\n🔄 Running database migrations...', colors.bright);
  if (!execute('npm run db:push', { ignoreError: true })) {
    log('❌ Database migration failed. Please check your database connection.', colors.red);
    return false;
  }
  
  // Seed database
  log('\n🌱 Seeding database...', colors.bright);
  if (!execute('npm run db:seed', { ignoreError: true })) {
    log('❌ Database seeding failed.', colors.red);
    return false;
  }
  
  return true;
}

// Start application
function startApplication() {
  log('\n🚀 Starting the application...', colors.bright);
  log('🔗 The app will be available at http://localhost:5000', colors.green);
  log('👤 You can login with username: demo, password: password', colors.green);
  execute('npm run dev');
}

// Main function
async function main() {
  log('\n🎵 Notes Vibes App Setup 🎵', colors.magenta + colors.bright);
  log('==========================', colors.magenta);
  
  log('\nThis script will help you set up the Notes Vibes app on your local machine.', colors.bright);
  log('It will guide you through installing dependencies, setting up the database, and starting the app.\n');
  
  setupEnvironment();
  
  rl.question('\nDo you want to install dependencies? (Y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'n') {
      if (installDependencies()) {
        rl.question('\nDo you want to set up the database? (Y/n): ', (answer) => {
          if (answer.toLowerCase() !== 'n') {
            if (setupDatabase()) {
              rl.question('\nDo you want to start the application? (Y/n): ', (answer) => {
                if (answer.toLowerCase() !== 'n') {
                  startApplication();
                } else {
                  log('\n✅ Setup completed! Run `npm run dev` to start the application.', colors.green);
                  rl.close();
                }
              });
            } else {
              rl.close();
            }
          } else {
            log('\n⚠️ Database setup skipped. You may need to set up the database manually.', colors.yellow);
            rl.close();
          }
        });
      } else {
        rl.close();
      }
    } else {
      log('\n⚠️ Dependencies installation skipped. You may need to run `npm install` manually.', colors.yellow);
      rl.close();
    }
  });
}

// Run the main function
main().catch(error => {
  log(`\n❌ An error occurred: ${error.message}`, colors.red);
  process.exit(1);
});