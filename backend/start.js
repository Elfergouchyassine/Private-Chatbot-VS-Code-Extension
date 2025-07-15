#!/usr/bin/env node

/**
 * Development startup script for the ChatBot Extension Backend
 * This script helps you get started quickly with the backend API
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ChatBot Extension Backend Setup');
console.log('=====================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📋 Creating .env file from template...');
  const examplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ .env file created');
    console.log('⚠️  Please edit .env with your actual LLM API configuration\n');
  }
}

// Load environment variables
require('dotenv').config();

// Check configuration
const requiredVars = ['LLM_API_URL', 'LLM_API_TOKEN'];
const missingVars = requiredVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here'));

if (missingVars.length > 0) {
  console.log('⚠️  Configuration needed:');
  console.log('Please update your .env file with:');
  missingVars.forEach(varName => {
    console.log(`   ${varName}=your_actual_value`);
  });
  console.log('\nExample for Hugging Face Llama:');
  console.log('   LLM_API_URL=https://router.huggingface.co/featherless-ai/v1/completions');
  console.log('   LLM_API_TOKEN=hf_YourActualTokenHere\n');
}

// Start the server
console.log('🔧 Starting the backend server...');
console.log(`📡 Server will run on: http://localhost:${process.env.PORT || 3001}`);
console.log('📊 Health check: http://localhost:3001/health');
console.log('🧪 Test endpoint: POST http://localhost:3001/api/chat/test\n');

// Import and start the server
require('./dist/server.js');
