#!/usr/bin/env node

// Script to add admin label to a user
require('dotenv').config({ path: '.env.local' });
const { Client, Users } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function addAdminLabel() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node scripts/add-admin-label.js user@example.com');
      process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // First, find the user by email
    const userList = await users.list([
      // Search by email - Appwrite doesn't have direct email search, so we'll list and filter
    ]);

    const user = userList.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('\n📋 Available users:');
      userList.users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.$id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.$id}`);
    console.log(`   Current labels: ${user.labels?.join(', ') || 'none'}`);

    // Check if user already has admin label
    if (user.labels && user.labels.includes('admin')) {
      console.log('⚠️  User already has admin label');
      return;
    }

    // Add admin label
    const currentLabels = user.labels || [];
    const newLabels = [...currentLabels, 'admin'];

    console.log(`🏷️  Adding admin label...`);
    
    await users.updateLabels(user.$id, newLabels);

    console.log('✅ Admin label added successfully!');
    console.log(`   New labels: ${newLabels.join(', ')}`);
    console.log('\n🎉 User can now access the admin panel!');

  } catch (error) {
    console.error('❌ Error adding admin label:', error.message);
    process.exit(1);
  }
}

// Check if API key is available
if (!process.env.APPWRITE_API_KEY) {
  console.log('❌ APPWRITE_API_KEY not found in environment variables');
  console.log('Please add it to your .env.local file');
  process.exit(1);
}

addAdminLabel();
