// API route to link client codes to users server-side
import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/appwrite.config';

export async function POST(request) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: 'Client code and user ID are required' },
        { status: 400 }
      );
    }

    // Use server-side Appwrite client (has admin access)
    const { databases } = createServerClient();

    // 1. Validate client code
    const { Query } = await import('node-appwrite');
    const codeQuery = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID,
      [
        Query.equal('code', code.toUpperCase()),
        Query.equal('isUsed', false)
      ]
    );

    if (codeQuery.documents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or already used client code'
      });
    }

    const codeDoc = codeQuery.documents[0];

    // 2. Link parent to student
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
      codeDoc.studentId,
      {
        parentId: userId
      }
    );

    // 3. Mark client code as used
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID,
      codeDoc.$id,
      {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      studentId: codeDoc.studentId
    });

  } catch (error) {
    console.error('Client code linking error:', error);
    return NextResponse.json(
      { success: false, error: 'Linking failed' },
      { status: 500 }
    );
  }
}
