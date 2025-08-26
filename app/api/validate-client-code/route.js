// API route to validate client codes server-side
import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/appwrite.config';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Client code is required' },
        { status: 400 }
      );
    }

    // Use server-side Appwrite client (has admin access)
    const { databases } = createServerClient();

    // Query for the client code
    const { Query } = await import('node-appwrite');
    const result = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID,
      [
        Query.equal('code', code.toUpperCase()),
        Query.equal('isUsed', false)
      ]
    );

    if (result.documents.length > 0) {
      return NextResponse.json({
        valid: true,
        studentId: result.documents[0].studentId
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or already used client code'
      });
    }

  } catch (error) {
    console.error('Client code validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
