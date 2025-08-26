// Client-side Appwrite configuration for Next.js app
import { Client, Account, Databases, Storage, Query } from 'appwrite';

// Create client instance
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Export services
export { account, databases, storage, Query };

// Configuration object
export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
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

export default client;
