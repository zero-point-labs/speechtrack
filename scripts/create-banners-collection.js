#!/usr/bin/env node

const { createServerClient } = require('../lib/appwrite.config');
const { ID } = require('node-appwrite');

async function createBannersCollection() {
  try {
    const { databases } = createServerClient();
    
    console.log('🎨 Creating admin_banners collection...');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = 'admin_banners';
    
    // Create the collection
    const collection = await databases.createCollection(
      databaseId,
      collectionId,
      'Admin Banners'
    );
    
    console.log('✅ Created collection:', collection.name);
    
    // Create attributes one by one with delays
    const attributes = [
      { key: 'text', type: 'string', size: 500, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'bgColor', type: 'string', size: 100, required: true },
      { key: 'borderColor', type: 'string', size: 100, required: true },
      { key: 'textColor', type: 'string', size: 100, required: true },
      { key: 'iconColor', type: 'string', size: 100, required: true },
      { key: 'icon', type: 'string', size: 50, required: true },
      { key: 'enabled', type: 'boolean', required: true },
      { key: 'order', type: 'integer', required: true }
    ];
    
    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required
          );
        }
        
        console.log(`✅ Created ${attr.type} attribute: ${attr.key}`);
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (attrError) {
        console.error(`❌ Error creating attribute ${attr.key}:`, attrError.message);
      }
    }
    
    // Wait for attributes to be ready then create default banners
    console.log('⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create default banners
    const defaultBanners = [
      {
        text: 'Οι ακυρώσεις τελευταίας στιγμής χρεώνονται κανονικά',
        type: 'warning',
        bgColor: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        icon: 'AlertTriangle',
        enabled: true,
        order: 1
      },
      {
        text: 'Για οποιαδήποτε βοήθεια καλέστε μας στο: 96684911',
        type: 'contact',
        bgColor: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        icon: 'Phone',
        enabled: true,
        order: 2
      }
    ];
    
    for (const banner of defaultBanners) {
      try {
        const doc = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          banner
        );
        console.log(`✅ Created banner: "${banner.text.substring(0, 50)}..."`);
      } catch (docError) {
        console.error('❌ Error creating banner:', docError.message);
      }
    }
    
    console.log('🎉 Banners collection setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If collection already exists, just try to create default banners
    if (error.message.includes('already exists')) {
      console.log('📋 Collection exists, skipping creation...');
    } else {
      process.exit(1);
    }
  }
}

createBannersCollection();
