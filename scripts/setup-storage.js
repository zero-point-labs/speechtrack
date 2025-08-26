const { createServerClient } = require('../lib/appwrite.config.js');

async function setupStorage() {
  try {
    const { storage } = createServerClient();

    console.log('🗂️ Setting up Appwrite Storage...');

    // Create session files bucket
    try {
      const sessionFilesBucket = await storage.createBucket(
        'speechtrack-session-files',
        'Session Files',
        'file', // bucket type
        ['any'], // read permissions
        ['any'], // write permissions
        true, // enabled
        50 * 1024 * 1024, // 50MB max file size
        ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi', 'mp3', 'wav'], // allowed file extensions
        true, // encryption
        true // antivirus
      );
      
      console.log('✅ Session Files bucket created:', sessionFilesBucket.$id);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️ Session Files bucket already exists');
      } else {
        console.error('❌ Error creating Session Files bucket:', error);
      }
    }

    // Create profile pictures bucket
    try {
      const profilePicturesBucket = await storage.createBucket(
        'speechtrack-profile-pictures',
        'Profile Pictures',
        'file',
        ['any'],
        ['any'],
        true,
        5 * 1024 * 1024, // 5MB max file size for profile pictures
        ['jpg', 'jpeg', 'png', 'gif'],
        true,
        true
      );
      
      console.log('✅ Profile Pictures bucket created:', profilePicturesBucket.$id);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️ Profile Pictures bucket already exists');
      } else {
        console.error('❌ Error creating Profile Pictures bucket:', error);
      }
    }

    console.log('🎉 Storage setup completed!');
    console.log('\n📝 Add these to your .env.local:');
    console.log('NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=speechtrack-session-files');
    console.log('NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=speechtrack-profile-pictures');

  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    process.exit(1);
  }
}

setupStorage();
