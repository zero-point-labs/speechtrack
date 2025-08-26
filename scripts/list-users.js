#!/usr/bin/env node

// Script to list all users and their labels
require('dotenv').config({ path: '.env.local' });
const { Client, Users } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function listUsers() {
  try {
    console.log('👥 Fetching all users...\n');

    const userList = await users.list();

    if (userList.users.length === 0) {
      console.log('📭 No users found');
      return;
    }

    console.log(`📋 Found ${userList.users.length} user(s):\n`);

    userList.users.forEach((user, index) => {
      const isAdmin = user.labels && user.labels.includes('admin');
      const adminBadge = isAdmin ? '👑 ADMIN' : '👤 USER';
      
      console.log(`${index + 1}. ${adminBadge}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.$id}`);
      console.log(`   Labels: ${user.labels?.join(', ') || 'none'}`);
      console.log(`   Created: ${new Date(user.$createdAt).toLocaleDateString()}`);
      console.log('');
    });

    const adminCount = userList.users.filter(u => u.labels && u.labels.includes('admin')).length;
    console.log(`📊 Summary: ${adminCount} admin(s), ${userList.users.length - adminCount} regular user(s)`);

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
}

// Check if API key is available
if (!process.env.APPWRITE_API_KEY) {
  console.log('❌ APPWRITE_API_KEY not found in environment variables');
  console.log('Please add it to your .env.local file');
  process.exit(1);
}

listUsers();
