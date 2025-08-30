// Authentication service for SpeechTrack
import { account, databases, appwriteConfig, Query, ID } from './appwrite.client';

// Auth state management
export const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  ERROR: 'auth:error'
};

// User roles (will be determined by labels later)
export const USER_ROLES = {
  ADMIN: 'admin',
  PARENT: 'parent'
};

// Session storage keys
const STORAGE_KEYS = {
  USER_SESSION: 'speechtrack_user_session',
  USER_ROLE: 'speechtrack_user_role'
};

// Utility functions
const isClient = typeof window !== 'undefined';

const getStorageItem = (key) => {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key, value) => {
  if (!isClient) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

const removeStorageItem = (key) => {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

// Unified Authentication (Appwrite-based)
export const auth = {
  /**
   * Register user with email/password and phone
   */
  register: async (email, password, name, phone) => {
    try {
      // Create Appwrite user account
      const user = await account.create(ID.unique(), email, password, name);
      
      // Create email session
      await account.createEmailPasswordSession(email, password);

      // Get updated user details (to check for any labels)
      const updatedUser = await account.get();
      
      // Check if user has admin label (unlikely for new registrations, but check anyway)
      const isAdmin = updatedUser.labels && updatedUser.labels.includes('admin');
      const role = isAdmin ? USER_ROLES.ADMIN : USER_ROLES.PARENT;

      // If not admin, create extended user data
      if (!isAdmin && phone) {
        try {
          // FALLBACK: Handle case where env vars aren't loaded on client
          const usersExtendedCollectionId = appwriteConfig.collections.usersExtended || '68aef5f19770fc264f6d';
          const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';
          
          console.log('Creating extended user data with fallback IDs if needed');
          
          await databases.createDocument(
            databaseId,
            usersExtendedCollectionId,
            ID.unique(),
            {
              userId: updatedUser.$id,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: phone,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            }
          );
        } catch (extendedDataError) {
          console.error('Failed to create extended user data:', extendedDataError);
          // Continue with registration even if extended data fails
        }
      }

      // Store session info
      setStorageItem(STORAGE_KEYS.USER_SESSION, updatedUser.$id);
      setStorageItem(STORAGE_KEYS.USER_ROLE, role);

      return {
        success: true,
        user: {
          id: updatedUser.$id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: role,
          isAdmin: isAdmin,
          labels: updatedUser.labels || [],
          phone: phone
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Login user with email/password
   */
  login: async (email, password) => {
    try {
      // Create session with Appwrite
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const user = await account.get();

      // Check if user has admin label
      const isAdmin = user.labels && user.labels.includes('admin');
      const role = isAdmin ? USER_ROLES.ADMIN : USER_ROLES.PARENT;

      // Store session info
      setStorageItem(STORAGE_KEYS.USER_SESSION, user.$id);
      setStorageItem(STORAGE_KEYS.USER_ROLE, role);

      return {
        success: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          role: role,
          isAdmin: isAdmin,
          labels: user.labels || []
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async () => {
    try {
      const user = await account.get();
      return !!user;
    } catch {
      return false;
    }
  },

  /**
   * Get current user session
   */
  getSession: async () => {
    try {
      const user = await account.get();

      // Check if user has admin label
      const isAdmin = user.labels && user.labels.includes('admin');
      const role = isAdmin ? USER_ROLES.ADMIN : USER_ROLES.PARENT;

      return {
        id: user.$id,
        email: user.email,
        name: user.name,
        role: role,
        isAdmin: isAdmin,
        labels: user.labels || []
      };

    } catch {
      return null;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await account.deleteSession('current');
      removeStorageItem(STORAGE_KEYS.USER_SESSION);
      removeStorageItem(STORAGE_KEYS.USER_ROLE);
      
      // Dispatch logout event
      if (isClient) {
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGOUT));
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// Export auth as default
export default auth;

// User management utilities
export const userUtils = {
  /**
   * Create extended user data
   */
  createExtendedData: async (userId, phone, address = '') => {
    try {
      const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.usersExtended,
        ID.unique(),
        {
          userId,
          phone,
          address,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get extended user data
   */
  getExtendedData: async (userId) => {
    try {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.usersExtended,
        [Query.equal('userId', userId)]
      );

      return {
        success: true,
        data: result.documents[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update last login time
   */
  updateLastLogin: async (userId) => {
    try {
      const extendedData = await this.getExtendedData(userId);
      
      if (extendedData.success && extendedData.data) {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.usersExtended,
          extendedData.data.$id,
          {
            lastLoginAt: new Date().toISOString()
          }
        );
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
