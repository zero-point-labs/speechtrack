#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixEnvVariables() {
  console.log('🔧 Fixing environment variables...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('Please create .env.local file first.');
    return;
  }

  // Read current .env.local content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if users_extended variable exists
  const usersExtendedId = '68aef5f19770fc264f6d'; // From our migration
  
  if (!envContent.includes('NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID')) {
    console.log('📝 Adding missing NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID...');
    
    // Add the variable
    envContent += `\n# Users Extended Collection (Parent onboarding system)\nNEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID=${usersExtendedId}\n`;
    
    // Write back to file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Added NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID');
  } else {
    console.log('✅ NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID already exists');
  }

  console.log('\n🎉 Environment variables updated!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your Next.js development server');
  console.log('2. Test the onboarding flow');
  console.log('3. Test the admin users page');
}

if (require.main === module) {
  fixEnvVariables();
}

module.exports = { fixEnvVariables };
