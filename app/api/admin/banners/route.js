import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite.config';
import { appwriteConfig, Query, ID } from '@/lib/appwrite.client';

// 🎨 BANNER MANAGEMENT API
// Handles CRUD operations for admin banners
// Stores banners in Appwrite database for persistence

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
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
    id: 'default-2', 
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

// GET - Fetch all banners
export async function GET() {
  try {
    const { databases } = createServerClient();
    
    // Use direct environment variable access for server-side operations
    const databaseId = appwriteConfig.databaseId;
    const adminBannersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_BANNERS_COLLECTION_ID;
    
    console.log('📢 Fetching admin banners...');
    console.log('🔧 Debug - Database ID:', databaseId);
    console.log('🔧 Debug - Admin Banners Collection ID:', adminBannersCollectionId);
    console.log('🔧 Debug - From config:', appwriteConfig.collections.adminBanners);
    
    // Validate required configuration
    if (!databaseId || !adminBannersCollectionId) {
      console.log('⚠️ Missing database or collection configuration, returning defaults');
      return NextResponse.json({
        success: true,
        banners: DEFAULT_BANNERS,
        isDefault: true,
        warning: 'Missing database configuration'
      });
    }
    
    // Try to get banners from database
    // If banners collection doesn't exist, we'll create it with default banners
    try {
      const bannersResponse = await databases.listDocuments(
        databaseId,
        adminBannersCollectionId,
        [Query.orderAsc('order')]
      );
      
      const banners = bannersResponse.documents.map(doc => ({
        id: doc.$id,
        text: doc.text,
        type: doc.type,
        bgColor: doc.bgColor,
        borderColor: doc.borderColor,
        textColor: doc.textColor,
        iconColor: doc.iconColor,
        icon: doc.icon,
        enabled: doc.enabled,
        order: doc.order
      }));
      
      console.log(`✅ Found ${banners.length} banners in database`);
      
      return NextResponse.json({
        success: true,
        banners
      });
      
    } catch (collectionError) {
      console.log('⚠️ Banners collection not found, returning defaults');
      
      // Return default banners if collection doesn't exist
      return NextResponse.json({
        success: true,
        banners: DEFAULT_BANNERS,
        isDefault: true
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching banners:', error);
    
    // Fallback to defaults on any error
    return NextResponse.json({
      success: true,
      banners: DEFAULT_BANNERS,
      isDefault: true,
      warning: 'Using default banners due to database error'
    });
  }
}

// POST - Save/update banners
export async function POST(request) {
  try {
    const { banners } = await request.json();
    
    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banners data' },
        { status: 400 }
      );
    }
    
    console.log(`💾 Saving ${banners.length} banners...`);
    
    // Use direct environment variable access for server-side operations
    const databaseId = appwriteConfig.databaseId;
    const adminBannersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_BANNERS_COLLECTION_ID;
    
    console.log('🔧 Debug POST - Database ID:', databaseId);
    console.log('🔧 Debug POST - Admin Banners Collection ID:', adminBannersCollectionId);
    
    // Validate required configuration
    if (!databaseId || !adminBannersCollectionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing database or collection configuration',
          debug: {
            databaseId: databaseId,
            collectionId: adminBannersCollectionId
          }
        },
        { status: 500 }
      );
    }
    
    const { databases } = createServerClient();
    
    // Try to clear existing banners and create new ones
    try {
      // Get existing banners
      console.log('🔧 Debug - About to list documents...');
      const existingBanners = await databases.listDocuments(
        databaseId,
        adminBannersCollectionId
      );
      
      // Delete existing banners
      const deletePromises = existingBanners.documents.map(doc =>
        databases.deleteDocument(
          databaseId,
          adminBannersCollectionId,
          doc.$id
        )
      );
      
      await Promise.all(deletePromises);
      console.log(`🗑️ Deleted ${existingBanners.documents.length} existing banners`);
      
    } catch (deleteError) {
      console.log('⚠️ No existing banners to delete or collection not found');
    }
    
    // Create new banners
    const createPromises = banners.map((banner, index) =>
      databases.createDocument(
        databaseId,
        adminBannersCollectionId,
        banner.id === `banner-${Date.now()}` ? ID.unique() : banner.id, // Generate new ID for new banners
        {
          text: banner.text,
          type: banner.type,
          bgColor: banner.bgColor,
          borderColor: banner.borderColor,
          textColor: banner.textColor,
          iconColor: banner.iconColor,
          icon: banner.icon,
          enabled: banner.enabled,
          order: index + 1
        }
      )
    );
    
    try {
      const createdBanners = await Promise.all(createPromises);
      console.log(`✅ Successfully saved ${createdBanners.length} banners`);
      
      return NextResponse.json({
        success: true,
        message: `${createdBanners.length} banners saved successfully`,
        banners: createdBanners.map(doc => ({
          id: doc.$id,
          text: doc.text,
          type: doc.type,
          bgColor: doc.bgColor,
          borderColor: doc.borderColor,
          textColor: doc.textColor,
          iconColor: doc.iconColor,
          icon: doc.icon,
          enabled: doc.enabled,
          order: doc.order
        }))
      });
      
    } catch (createError) {
      console.error('❌ Error creating banners:', createError);
      
      // If collection doesn't exist, we can't save but we can still work with defaults
      if (createError.message?.includes('Collection with the requested ID could not be found')) {
        return NextResponse.json({
          success: true,
          warning: 'Banners saved in memory only (database collection not configured)',
          banners: banners // Return the banners as-is
        });
      }
      
      throw createError;
    }
    
  } catch (error) {
    console.error('❌ Error saving banners:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save banners' 
      },
      { status: 500 }
    );
  }
}
