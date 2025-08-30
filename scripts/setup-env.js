#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up environment file for SpeechTrack...\n');

const envTemplate = `# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here

# Server-side Appwrite (for setup scripts)
APPWRITE_API_KEY=your-api-key-here

# Database and Collection IDs (will be filled by setup script)
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID=

# Storage Bucket IDs (will be filled by setup script)
NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=
NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=

# Cloudflare R2 Storage Configuration (Migration)
CLOUDFLARE_R2_ENDPOINT=your-r2-endpoint-here
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key-here
CLOUDFLARE_R2_BUCKET_NAME=speechtrack-session-files

# Storage Feature Toggles
USE_R2_STORAGE=false
ENABLE_MIXED_STORAGE_MODE=false

# Admin Authentication
ADMIN_PASSWORD=Marilena.Speech.1!
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Please update it manually with the template above.');
    console.log('\n📄 Environment template:\n');
    console.log(envTemplate);
  } else {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env.local file');
    console.log('\n📝 Please update the following values in .env.local:');
    console.log('   - NEXT_PUBLIC_APPWRITE_PROJECT_ID (your Appwrite project ID)');
    console.log('   - APPWRITE_API_KEY (your Appwrite API key)');
  }
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('\n📄 Please create .env.local manually with this content:\n');
  console.log(envTemplate);
}

console.log('\n🔧 Next steps:');
console.log('1. Update .env.local with your Appwrite credentials');
console.log('2. Run: npm install');
console.log('3. Run: node scripts/setup-database.js');
