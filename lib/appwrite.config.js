import { Client, Databases, Storage, Account, Query } from 'node-appwrite';

// Server-side client for setup scripts
const createServerClient = () => {
  const client = new Client();
  
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    account: new Account(client)
  };
};

// Client-side configuration (for Next.js app)
const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  collections: {
    students: process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
    sessions: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID,
    sessionFiles: process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID,
    sessionFeedback: process.env.NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID,
    messages: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
    achievements: process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID,
    clientCodes: process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID,
  },
  buckets: {
    files: process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, // Single bucket for all files
  }
};

export {
  createServerClient,
  appwriteConfig
};
