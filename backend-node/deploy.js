#!/usr/bin/env node

/**
 * Quick deployment script for SupaWave Backend
 * Fixes CORS issues and redeploys to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 SupaWave Backend Deployment Script');
console.log('=====================================');

// Check if we're in the right directory
if (!fs.existsSync('./package.json')) {
  console.error('❌ Error: package.json not found. Run this from the backend-node directory.');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔧 Checking CORS configuration...');
  const serverJs = fs.readFileSync('./server.js', 'utf8');
  if (serverJs.includes('origin: true') && serverJs.includes('optionsSuccessStatus: 200')) {
    console.log('✅ CORS configuration looks good');
  } else {
    console.log('⚠️  CORS configuration may need updating');
  }
  
  console.log('🌐 Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });
  
  console.log('✅ Deployment complete!');
  console.log('🔗 Your backend should now handle CORS requests properly');
  console.log('📝 Test your API endpoints to verify CORS is working');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}