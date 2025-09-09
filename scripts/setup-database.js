#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createServerClient } = require('../lib/appwrite.config');

const { databases, storage } = createServerClient();

// Database and collection configurations
const DATABASE_NAME = 'speechtrack_main';
const COLLECTIONS = {
  students: {
    name: 'students',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'age', type: 'integer', required: true },
      { key: 'dateOfBirth', type: 'datetime', required: false },
      { key: 'profilePicture', type: 'string', size: 2000, required: false },
      { key: 'totalSessions', type: 'integer', required: true, default: 0 },
      { key: 'completedSessions', type: 'integer', required: true, default: 0 },
      { key: 'status', type: 'enum', elements: ['active', 'inactive', 'completed'], required: true },
      { key: 'parentId', type: 'string', size: 36, required: false },
      { key: 'clientCode', type: 'string', size: 20, required: true },
      { key: 'joinDate', type: 'datetime', required: true },
      { key: 'nextSession', type: 'datetime', required: false },
      { key: 'parentContact', type: 'string', size: 1000, required: true } // JSON string
    ],
    indexes: [
      { key: 'clientCode_idx', type: 'unique', attributes: ['clientCode'] },
      { key: 'parentId_idx', type: 'key', attributes: ['parentId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] }
    ]
  },
  sessions: {
    name: 'sessions',
    attributes: [
      { key: 'studentId', type: 'string', size: 36, required: true },
      { key: 'sessionNumber', type: 'integer', required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'date', type: 'datetime', required: true },
      { key: 'duration', type: 'string', size: 50, required: true },
      { key: 'status', type: 'enum', elements: ['locked', 'available', 'completed', 'cancelled'], required: true },
      { key: 'isPaid', type: 'boolean', required: true, default: false },
      { key: 'isGESY', type: 'boolean', required: false, default: false },
      { key: 'gesyNote', type: 'string', size: 500, required: false },
      { key: 'therapistNotes', type: 'string', size: 5000, required: false },
      { key: 'originalDate', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'studentId_idx', type: 'key', attributes: ['studentId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
      { key: 'student_session_idx', type: 'unique', attributes: ['studentId', 'sessionNumber'] }
    ]
  },
  sessionFiles: {
    name: 'session_files',
    attributes: [
      { key: 'sessionId', type: 'string', size: 36, required: true },
      { key: 'fileName', type: 'string', size: 255, required: true },
      { key: 'fileId', type: 'string', size: 36, required: true },
      { key: 'fileType', type: 'enum', elements: ['pdf', 'image', 'video', 'audio'], required: true },
      { key: 'fileSize', type: 'integer', required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'uploadedBy', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
      { key: 'fileType_idx', type: 'key', attributes: ['fileType'] }
    ]
  },
  sessionFeedback: {
    name: 'session_feedback',
    attributes: [
      { key: 'sessionId', type: 'string', size: 36, required: true },
      { key: 'authorId', type: 'string', size: 36, required: true },
      { key: 'authorType', type: 'enum', elements: ['parent', 'therapist'], required: true },
      { key: 'message', type: 'string', size: 2000, required: true },
      { key: 'isRead', type: 'boolean', required: true, default: false }
    ],
    indexes: [
      { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
      { key: 'authorId_idx', type: 'key', attributes: ['authorId'] },
      { key: 'isRead_idx', type: 'key', attributes: ['isRead'] }
    ]
  },
  messages: {
    name: 'messages',
    attributes: [
      { key: 'studentId', type: 'string', size: 36, required: true },
      { key: 'senderId', type: 'string', size: 36, required: true },
      { key: 'receiverId', type: 'string', size: 36, required: true },
      { key: 'content', type: 'string', size: 2000, required: true },
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'messageType', type: 'enum', elements: ['text', 'file'], required: true },
      { key: 'fileId', type: 'string', size: 36, required: false }
    ],
    indexes: [
      { key: 'studentId_idx', type: 'key', attributes: ['studentId'] },
      { key: 'senderId_idx', type: 'key', attributes: ['senderId'] },
      { key: 'receiverId_idx', type: 'key', attributes: ['receiverId'] },
      { key: 'isRead_idx', type: 'key', attributes: ['isRead'] }
    ]
  },
  achievements: {
    name: 'achievements',
    attributes: [
      { key: 'sessionId', type: 'string', size: 36, required: true },
      { key: 'studentId', type: 'string', size: 36, required: true },
      { key: 'type', type: 'enum', elements: ['milestone', 'skill', 'breakthrough'], required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 500, required: true },
      { key: 'icon', type: 'enum', elements: ['star', 'zap', 'trophy', 'award'], required: true },
      { key: 'earnedDate', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
      { key: 'studentId_idx', type: 'key', attributes: ['studentId'] },
      { key: 'type_idx', type: 'key', attributes: ['type'] }
    ]
  },
  clientCodes: {
    name: 'client_codes',
    attributes: [
      { key: 'code', type: 'string', size: 20, required: true },
      { key: 'studentId', type: 'string', size: 36, required: true },
      { key: 'isUsed', type: 'boolean', required: true, default: false },
      { key: 'usedBy', type: 'string', size: 36, required: false },
      { key: 'expiresAt', type: 'datetime', required: false },
      { key: 'usedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'code_idx', type: 'unique', attributes: ['code'] },
      { key: 'studentId_idx', type: 'key', attributes: ['studentId'] },
      { key: 'isUsed_idx', type: 'key', attributes: ['isUsed'] }
    ]
  }
};

const BUCKETS = {
  allFiles: {
    name: 'speechtrack-files',
    permissions: ['read("any")', 'write("any")'], // We'll refine permissions later
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 50000000, // 50MB
    allowedFileExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mp3', 'wav'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDatabase() {
  console.log('🗄️  Creating database...');
  
  try {
    const database = await databases.create('unique()', DATABASE_NAME);
    console.log(`✅ Database created: ${database.$id}`);
    return database.$id;
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️  Database already exists, fetching existing database...');
      const databaseList = await databases.list();
      const existingDb = databaseList.databases.find(db => db.name === DATABASE_NAME);
      if (existingDb) {
        console.log(`✅ Using existing database: ${existingDb.$id}`);
        return existingDb.$id;
      }
    }
    throw error;
  }
}

async function createCollection(databaseId, collectionConfig) {
  console.log(`📁 Creating collection: ${collectionConfig.name}...`);
  
  try {
    // Create collection
    const collection = await databases.createCollection(
      databaseId,
      'unique()',
      collectionConfig.name
    );
    
    console.log(`✅ Collection created: ${collection.$id}`);
    
    // Wait a bit for collection to be ready
    await sleep(1000);
    
    // Add attributes
    for (const attr of collectionConfig.attributes) {
      try {
        console.log(`  📝 Adding attribute: ${attr.key} (${attr.type})`);
        
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.size,
              attr.required,
              attr.default || null
            );
            break;
          case 'integer':
            await databases.createIntegerAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.required,
              attr.min || null,
              attr.max || null,
              attr.default || null
            );
            break;
          case 'boolean':
            await databases.createBooleanAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.required,
              attr.default || null
            );
            break;
          case 'datetime':
            await databases.createDatetimeAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.required,
              attr.default || null
            );
            break;
          case 'enum':
            await databases.createEnumAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.elements,
              attr.required,
              attr.default || null
            );
            break;
        }
        
        // Wait between attribute creation
        await sleep(500);
        
      } catch (attrError) {
        if (attrError.code === 409) {
          console.log(`  ⚠️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`  ❌ Error creating attribute ${attr.key}:`, attrError.message);
        }
      }
    }
    
    // Wait for attributes to be ready before creating indexes
    await sleep(2000);
    
    // Add indexes
    for (const index of collectionConfig.indexes || []) {
      try {
        console.log(`  🔍 Creating index: ${index.key}`);
        await databases.createIndex(
          databaseId,
          collection.$id,
          index.key,
          index.type,
          index.attributes
        );
        await sleep(500);
      } catch (indexError) {
        if (indexError.code === 409) {
          console.log(`  ⚠️  Index ${index.key} already exists`);
        } else {
          console.error(`  ❌ Error creating index ${index.key}:`, indexError.message);
        }
      }
    }
    
    return collection.$id;
    
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️  Collection ${collectionConfig.name} already exists`);
      const collections = await databases.listCollections(databaseId);
      const existing = collections.collections.find(c => c.name === collectionConfig.name);
      return existing ? existing.$id : null;
    }
    throw error;
  }
}

async function createBucket(bucketConfig) {
  console.log(`🪣 Creating storage bucket: ${bucketConfig.name}...`);
  
  try {
    const bucket = await storage.createBucket(
      'unique()',
      bucketConfig.name,
      bucketConfig.permissions,
      bucketConfig.fileSecurity,
      bucketConfig.enabled,
      bucketConfig.maximumFileSize,
      bucketConfig.allowedFileExtensions,
      bucketConfig.compression,
      bucketConfig.encryption,
      bucketConfig.antivirus
    );
    
    console.log(`✅ Storage bucket created: ${bucket.$id}`);
    return bucket.$id;
    
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️  Bucket ${bucketConfig.name} already exists`);
      const buckets = await storage.listBuckets();
      const existing = buckets.buckets.find(b => b.name === bucketConfig.name);
      return existing ? existing.$id : null;
    }
    throw error;
  }
}

async function updateEnvFile(ids) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found. Please create it first.');
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update database and collection IDs
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_DATABASE_ID=.*/, `NEXT_PUBLIC_APPWRITE_DATABASE_ID=${ids.database}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID=${ids.collections.students}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=${ids.collections.sessions}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID=${ids.collections.sessionFiles}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID=${ids.collections.sessionFeedback}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=${ids.collections.messages}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID=${ids.collections.achievements}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID=.*/, `NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID=${ids.collections.clientCodes}`);
  
  // Update bucket IDs (using single bucket for both)
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=.*/, `NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=${ids.buckets.allFiles}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=.*/, `NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=${ids.buckets.allFiles}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with generated IDs');
}

async function main() {
  console.log('🚀 Setting up SpeechTrack database and storage...\n');
  
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      console.error('❌ Missing required environment variables. Please check your .env.local file.');
      console.error('Required: NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
      process.exit(1);
    }
    
    const ids = {
      collections: {},
      buckets: {}
    };
    
    // Create database
    ids.database = await createDatabase();
    await sleep(2000);
    
    // Create collections
    console.log('\n📁 Creating collections...');
    for (const [key, config] of Object.entries(COLLECTIONS)) {
      ids.collections[key] = await createCollection(ids.database, config);
      await sleep(1000);
    }
    
    // Create storage buckets
    console.log('\n🪣 Creating storage buckets...');
    for (const [key, config] of Object.entries(BUCKETS)) {
      ids.buckets[key] = await createBucket(config);
      await sleep(1000);
    }
    
    // Update environment file
    console.log('\n📝 Updating environment file...');
    await updateEnvFile(ids);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Database ID: ${ids.database}`);
    console.log(`   Collections: ${Object.keys(ids.collections).length}`);
    console.log(`   Storage Buckets: ${Object.keys(ids.buckets).length}`);
    
    console.log('\n🔧 Next steps:');
    console.log('1. Run: node scripts/test-connection.js');
    console.log('2. Start integrating with your Next.js app');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
