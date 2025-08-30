import { createServerClient } from '../lib/appwrite.config.js';
import { ID } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { databases } = createServerClient();

async function setupAchievementCollections() {
  try {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error('Database ID not found in environment variables');
    }

    console.log('🎯 Setting up Achievement System Collections...\n');

    // 1. Create achievement_journeys collection
    console.log('Creating achievement_journeys collection...');
    const achievementJourneys = await databases.createCollection(
      databaseId,
      ID.unique(),
      'achievement_journeys',
      [
        'read("users")',
        'write("users")',
        'delete("users")'
      ]
    );

    // Add attributes for achievement_journeys
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'studentId', 255, true);
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'journeyName', 255, true);
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'description', 1000, false);
    await databases.createBooleanAttribute(databaseId, achievementJourneys.$id, 'isActive', true);
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'createdBy', 255, true);
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'templateId', 255, false);
    await databases.createIntegerAttribute(databaseId, achievementJourneys.$id, 'totalSteps', true);
    
    // JSON attribute for step configuration (will store the array as JSON)
    await databases.createStringAttribute(databaseId, achievementJourneys.$id, 'stepConfiguration', 65535, true);

    // Create indexes
    await databases.createIndex(
      databaseId,
      achievementJourneys.$id,
      'idx_studentId',
      'key',
      ['studentId']
    );
    
    await databases.createIndex(
      databaseId,
      achievementJourneys.$id,
      'idx_isActive',
      'key',
      ['isActive']
    );

    console.log('✅ achievement_journeys collection created with ID:', achievementJourneys.$id);

    // 2. Create journey_templates collection
    console.log('\nCreating journey_templates collection...');
    const journeyTemplates = await databases.createCollection(
      databaseId,
      ID.unique(),
      'journey_templates',
      [
        'read("users")',
        'write("users")',
        'delete("users")'
      ]
    );

    // Add attributes for journey_templates
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'name', 255, true);
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'description', 1000, false);
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'category', 50, true);
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'ageGroup', 20, false);
    await databases.createIntegerAttribute(databaseId, journeyTemplates.$id, 'sessionCount', true);
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'templateSteps', 65535, true); // JSON
    await databases.createStringAttribute(databaseId, journeyTemplates.$id, 'createdBy', 255, true);
    await databases.createBooleanAttribute(databaseId, journeyTemplates.$id, 'isPublic', true);
    await databases.createIntegerAttribute(databaseId, journeyTemplates.$id, 'usageCount', false);
    await databases.createFloatAttribute(databaseId, journeyTemplates.$id, 'rating', false);

    // Create indexes
    await databases.createIndex(
      databaseId,
      journeyTemplates.$id,
      'idx_category',
      'key',
      ['category']
    );
    
    await databases.createIndex(
      databaseId,
      journeyTemplates.$id,
      'idx_isPublic',
      'key',
      ['isPublic']
    );

    console.log('✅ journey_templates collection created with ID:', journeyTemplates.$id);

    // 3. Create trophy_library collection
    console.log('\nCreating trophy_library collection...');
    const trophyLibrary = await databases.createCollection(
      databaseId,
      ID.unique(),
      'trophy_library',
      [
        'read("users")',
        'write("users")',
        'delete("users")'
      ]
    );

    // Add attributes for trophy_library
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'name', 255, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'icon', 10, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'category', 50, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'description', 500, false);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'backgroundColor', 7, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'glowColor', 7, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'particleColor', 7, false);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'availableAnimations', 500, true); // JSON array
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'defaultAnimation', 50, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'defaultUnlockMessage', 255, false);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'celebrationSound', 255, false);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'difficulty', 20, true);
    await databases.createStringAttribute(databaseId, trophyLibrary.$id, 'rarity', 20, true);

    // Create index
    await databases.createIndex(
      databaseId,
      trophyLibrary.$id,
      'idx_category',
      'key',
      ['category']
    );

    console.log('✅ trophy_library collection created with ID:', trophyLibrary.$id);

    // Wait a bit for attributes to be fully ready
    console.log('\n⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add some default trophies to the library
    console.log('\n📚 Adding default trophies to library...');
    
    const defaultTrophies = [
      {
        name: 'Bronze Champion',
        icon: '🥉',
        category: 'milestone',
        description: 'First major milestone achievement',
        backgroundColor: '#CD7F32',
        glowColor: '#FFD700',
        particleColor: '#FFA500',
        availableAnimations: JSON.stringify(['confetti', 'sparkles', 'glow']),
        defaultAnimation: 'confetti',
        defaultUnlockMessage: 'Great job reaching this milestone!',
        difficulty: 'easy',
        rarity: 'common'
      },
      {
        name: 'Silver Star',
        icon: '🥈',
        category: 'milestone',
        description: 'Second major milestone achievement',
        backgroundColor: '#C0C0C0',
        glowColor: '#FFFFFF',
        particleColor: '#E5E5E5',
        availableAnimations: JSON.stringify(['confetti', 'sparkles', 'glow']),
        defaultAnimation: 'sparkles',
        defaultUnlockMessage: 'Excellent progress! Keep it up!',
        difficulty: 'medium',
        rarity: 'common'
      },
      {
        name: 'Golden Trophy',
        icon: '🏆',
        category: 'completion',
        description: 'Journey completion achievement',
        backgroundColor: '#FFD700',
        glowColor: '#FFFFFF',
        particleColor: '#FFA500',
        availableAnimations: JSON.stringify(['fireworks', 'confetti', 'sparkles']),
        defaultAnimation: 'fireworks',
        defaultUnlockMessage: 'Congratulations! You are now a Speech Master!',
        difficulty: 'hard',
        rarity: 'rare'
      },
      {
        name: 'Rising Star',
        icon: '⭐',
        category: 'skill',
        description: 'Skill improvement achievement',
        backgroundColor: '#FFD700',
        glowColor: '#FFFF00',
        particleColor: '#FFF8DC',
        availableAnimations: JSON.stringify(['sparkles', 'glow']),
        defaultAnimation: 'sparkles',
        defaultUnlockMessage: 'Your skills are shining bright!',
        difficulty: 'easy',
        rarity: 'common'
      },
      {
        name: 'Diamond Excellence',
        icon: '💎',
        category: 'special',
        description: 'Exceptional performance achievement',
        backgroundColor: '#B9F2FF',
        glowColor: '#FFFFFF',
        particleColor: '#00CED1',
        availableAnimations: JSON.stringify(['sparkles', 'confetti', 'glow']),
        defaultAnimation: 'sparkles',
        defaultUnlockMessage: 'Outstanding achievement! You\'re exceptional!',
        difficulty: 'expert',
        rarity: 'legendary'
      }
    ];

    for (const trophy of defaultTrophies) {
      await databases.createDocument(
        databaseId,
        trophyLibrary.$id,
        ID.unique(),
        trophy
      );
    }

    console.log('✅ Default trophies added to library');

    // Output collection IDs for .env.local
    console.log('\n📋 Add these to your .env.local file:');
    console.log(`NEXT_PUBLIC_APPWRITE_ACHIEVEMENT_JOURNEYS_COLLECTION_ID=${achievementJourneys.$id}`);
    console.log(`NEXT_PUBLIC_APPWRITE_JOURNEY_TEMPLATES_COLLECTION_ID=${journeyTemplates.$id}`);
    console.log(`NEXT_PUBLIC_APPWRITE_TROPHY_LIBRARY_COLLECTION_ID=${trophyLibrary.$id}`);
    
    console.log('\n✨ Achievement system collections setup complete!');

  } catch (error) {
    console.error('❌ Error setting up achievement collections:', error);
    
    if (error.code === 409) {
      console.log('\n⚠️  One or more collections already exist. You may want to:');
      console.log('   1. Delete existing collections in Appwrite console');
      console.log('   2. Use different collection names');
      console.log('   3. Skip creation of existing collections');
    }
  }
}

// Run the setup
setupAchievementCollections();
