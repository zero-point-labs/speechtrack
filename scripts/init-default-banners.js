#!/usr/bin/env node

const { createServerClient } = require('../lib/appwrite.config');
const { appwriteConfig, ID } = require('../lib/appwrite.client');

async function initializeDefaultBanners() {
  try {
    const { databases } = createServerClient();
    
    console.log('🎨 Initializing default banners...');
    
    // Check if any banners already exist
    try {
      const existingBanners = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.adminBanners
      );
      
      if (existingBanners.documents.length > 0) {
        console.log(`✅ Found ${existingBanners.documents.length} existing banners, skipping initialization`);
        return;
      }
    } catch (error) {
      console.error('❌ Error checking existing banners:', error.message);
      return;
    }
    
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
    
    console.log(`📝 Creating ${defaultBanners.length} default banners...`);
    
    for (const banner of defaultBanners) {
      try {
        const doc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.adminBanners,
          ID.unique(),
          banner
        );
        console.log(`✅ Created banner: "${banner.text.substring(0, 50)}..."`);
      } catch (docError) {
        console.error('❌ Error creating banner:', docError.message);
      }
    }
    
    console.log('🎉 Default banners initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing default banners:', error.message);
    process.exit(1);
  }
}

initializeDefaultBanners();
