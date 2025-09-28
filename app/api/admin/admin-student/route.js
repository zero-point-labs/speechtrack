import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite.config';
import { appwriteConfig, ID } from '@/lib/appwrite.client';

// 👤 ADMIN AS STUDENT API
// Creates a virtual student entry for admin user
// Allows admin to practice using the system as a student

export async function GET(request) {
  try {
    const { account, databases } = createServerClient();
    
    console.log('👤 Creating admin as student...');
    
    // Get current admin user
    const adminAccount = await account.get();
    console.log(`🔍 Admin account info:`, {
      id: adminAccount.$id,
      name: adminAccount.name,
      email: adminAccount.email
    });
    
    // Create virtual student ID for admin
    const adminStudentId = `admin-student-${adminAccount.$id}`;
    
    // Check if admin student already exists
    let adminStudent;
    try {
      adminStudent = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        adminStudentId
      );
      
      console.log('✅ Found existing admin student entry');
    } catch (error) {
      // Create admin student entry if it doesn't exist
      try {
        adminStudent = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.students,
          adminStudentId,
          {
            name: `${adminAccount.name} (Admin Practice)`,
            parentId: adminAccount.$id,
            age: null,
            dateOfBirth: null,
            status: 'active',
            notes: 'Admin practice account for learning the system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        
        console.log('✅ Created new admin student entry');
      } catch (createError) {
        console.error('❌ Error creating admin student:', createError);
        throw createError;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        studentId: adminStudent.$id,
        student: {
          id: adminStudent.$id,
          name: adminStudent.name,
          parentId: adminStudent.parentId,
          age: adminStudent.age,
          dateOfBirth: adminStudent.dateOfBirth,
          status: adminStudent.status,
          notes: adminStudent.notes
        },
        adminInfo: {
          id: adminAccount.$id,
          name: adminAccount.name,
          email: adminAccount.email
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Admin as student API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create admin student entry' 
      },
      { status: 500 }
    );
  }
}
