#!/usr/bin/env node

/**
 * Setup Admin Banners Collection
 * Creates the admin_banners collection in Appwrite with required attributes
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');

// Load environment variables
require('dotenv').config();

const client = new Client();
const databases = new Databases(client);

// Configure Appwrite client
client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const collectionId = 'admin_banners';

async function setupAdminBannersCollection() {
    try {
        console.log('🎨 Setting up admin banners collection...');
        
        // Check if collection already exists
        try {
            const existingCollection = await databases.getCollection(databaseId, collectionId);
            console.log('✅ Collection already exists:', existingCollection.name);
            return;
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
            console.log('📝 Collection not found, creating...');
        }
        
        // Create the collection
        const collection = await databases.createCollection(
            databaseId,
            collectionId,
            'Admin Banners',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        );
        
        console.log('✅ Created collection:', collection.name);
        
        // Define attributes
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
        
        // Create attributes
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
                
                // Wait a bit between attribute creation to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (attrError) {
                console.error(`❌ Error creating attribute ${attr.key}:`, attrError.message);
            }
        }
        
        // Create index for ordering
        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for attributes to be ready
            await databases.createIndex(
                databaseId,
                collectionId,
                'order_index',
                'key',
                ['order'],
                ['ASC']
            );
            console.log('✅ Created order index');
        } catch (indexError) {
            console.error('❌ Error creating index:', indexError.message);
        }
        
        console.log('🎉 Admin banners collection setup complete!');
        
        // Initialize with default banners
        await initializeDefaultBanners();
        
    } catch (error) {
        console.error('❌ Error setting up collection:', error);
        process.exit(1);
    }
}

async function initializeDefaultBanners() {
    try {
        console.log('📝 Creating default banners...');
        
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
                await databases.createDocument(
                    databaseId,
                    collectionId,
                    'unique()',
                    banner
                );
                console.log(`✅ Created banner: "${banner.text.substring(0, 50)}..."`);
            } catch (docError) {
                console.error('❌ Error creating banner:', docError.message);
            }
        }
        
        console.log('🎉 Default banners initialized!');
        
    } catch (error) {
        console.error('❌ Error initializing default banners:', error);
    }
}

// Run the setup
setupAdminBannersCollection()
    .then(() => {
        console.log('🚀 Setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    });
