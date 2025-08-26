// Authentication service for SpeechTrack
import { account, databases, appwriteConfig, Query } from './appwrite.client';

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
   * Register user with email/password
   */
  register: async (email, password, name) => {
    try {
      // Create Appwrite user account
      const user = await account.create('unique()', email, password, name);
      
      // Create email session
      await account.createEmailPasswordSession(email, password);

      // Get updated user details (to check for any labels)
      const updatedUser = await account.get();
      
      // Check if user has admin label (unlikely for new registrations, but check anyway)
      const isAdmin = updatedUser.labels && updatedUser.labels.includes('admin');
      const role = isAdmin ? USER_ROLES.ADMIN : USER_ROLES.PARENT;

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
          labels: updatedUser.labels || []
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

// Client code utilities
export const clientCodes = {
  /**
   * Validate a client code (using server-side API)
   */
  validate: async (code) => {
    try {
      const response = await fetch('/api/validate-client-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  /**
   * Generate a new client code for a student
   */
  generate: async (studentId) => {
    try {
      // Generate 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create client code document
      const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.clientCodes,
        'unique()',
        {
          code,
          studentId,
          isUsed: false
        }
      );

      return {
        success: true,
        code: result.code,
        id: result.$id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Link a client code to a user (using server-side API)
   */
  linkToUser: async (code, userId) => {
    try {
      const response = await fetch('/api/link-client-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
