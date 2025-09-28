"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  Users, 
  Search, 
  Trash2,
  Eye, 
  Phone,
  Mail,
  Calendar,
  Baby, 
  BookOpen, 
  ArrowLeft,
  Settings,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import TutorialCard from "@/components/admin/TutorialCard";

// Greek language constants
const GREEK_TEXT = {
  // Header
  adminTitle: "Διαχείριση Συστήματος",
  adminSubtitle: "Πλήρης διαχείριση χρηστών και φακέλων συνεδριών",
  
  // Navigation
  back: "Πίσω",
  userList: "Λίστα Χρηστών", 
  oldAdmin: "Παλιό Σύστημα",
  
  // Folder Manager
  sessionFolders: "Φάκελοι Συνεδριών",
  folderSessions: "Συνεδρίες Φακέλου",
  manageFolders: "Διαχείριση φακέλων συνεδριών για οργανωμένες θεραπευτικές περιόδους",
  viewingSessions: "Προβολή συνεδριών στο",
  
  // Search  
  searchPlaceholder: "Αναζήτηση χρηστών, email, τηλέφωνο ή όνομα παιδιού...",
  refresh: "Ανανέωση",
  loading: "Φόρτωση...",
  
  // User Info
  children: "παιδί/ά",
  sessions: "συνεδρίες", 
  details: "Λεπτομέρειες",
  
  // No Data
  noUsersFound: "Δεν βρέθηκαν χρήστες",
  noUsers: "Δεν υπάρχουν χρήστες",
  
  // Parent Details
  parentDetails: "Στοιχεία Γονέα",
  fullName: "Πλήρες Όνομα",
  email: "Email",
  phone: "Τηλέφωνο", 
  registrationDate: "Ημερομηνία Εγγραφής",
  userId: "ID Χρήστη",
  address: "Διεύθυνση",
  notProvided: "Δεν δόθηκε",
  
  // Statistics
  totalSessions: "Σύνολο Συνεδριών",
  activeChildren: "Ενεργά Παιδιά",
  totalUsers: "Σύνολο Χρηστών",
  totalChildren: "Σύνολο Παιδιών", 
  activeParents: "Ενεργοί Γονείς",
  
  // Children Details
  childrenDetails: "Στοιχεία Παιδιών",
  noChildren: "Δεν έχουν καταχωρηθεί παιδιά",
  childrenWillAppear: "Τα παιδιά θα εμφανιστούν εδώ όταν προστεθούν στο σύστημα",
  age: "Ηλικία", 
  yearsOld: "ετών",
  status: "Κατάσταση",
  active: "Ενεργό",
  inactive: "Ανενεργό",
  joinDate: "Ημ. Εγγραφής",
  studentId: "ID Μαθητή",
  dateOfBirth: "Ημερομηνία Γέννησης",
  manageSessionFolders: "Διαχείριση Φακέλων Συνεδριών",
  
  // Quick Actions
  quickActions: "Γρήγορες Ενέργειες",
  fullDetails: "Πλήρη Στοιχεία", 
  addChild: "Προσθήκη Παιδιού",
  call: "Κλήση",
  emailAction: "Email",
  
  // Confirmation
  confirmDelete: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη; Αυτή η ενέργεια θα διαγράψει όλα τα δεδομένα του και δεν μπορεί να αναιρεθεί.",
  
  // Errors
  errorFetchingUsers: "Αποτυχία φόρτωσης χρηστών",
  errorDeletingUser: "Αποτυχία διαγραφής χρήστη", 
  errorOccurred: "Προέκυψε σφάλμα κατά τη διαγραφή"
};

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

interface UserExtended {
  $id: string;
  userId: string;
  name?: string;
  email?: string;
  phone: string;
  address?: string;
  profilePicture?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  registration: string;
  status: boolean;
}

interface Student {
  $id: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  parentId: string;
  status: string;
  totalSessions?: number;
  completedSessions?: number;
  joinDate: string;
}

interface Session {
  $id: string;
  studentId: string;
  sessionNumber: number;
  title: string;
  date: string;
  status: string;
  duration: string;
  isPaid: boolean;
}

interface UserWithDetails extends AppwriteUser {
  extendedData?: UserExtended;
  children: Student[];
  sessions: Session[];
  totalSessions: number;
  isAdmin?: boolean; // 👤 ADMIN FLAG: Identifies admin users
}



// 🚀 ENHANCED UI/UX: Custom debounce hook for better search performance
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

function AdminPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // 🔧 SETTINGS: Admin settings modal state
  
  // 🚀 ENHANCED UI/UX: Debounced search term (400ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 20;
  
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // 🚀 OPTIMIZED: Fetch users with single API call
  const fetchUsers = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError("");

      console.log('🚀 OPTIMIZATION: Loading optimized admin dashboard data...');
      console.log('🔍 DEBUGGING: Calling optimized API:', `/api/admin/dashboard-data?page=${page}&limit=${USERS_PER_PAGE}`);
      
      // ===== SINGLE OPTIMIZED API CALL =====
      // This replaces 4 separate database queries with 1 efficient call
      const response = await fetch(`/api/admin/dashboard-data?page=${page}&limit=${USERS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error(`Admin dashboard API error: ${response.status}`);
      }
      
      const { success, data, meta } = await response.json();
      
      if (!success) {
        throw new Error('Admin dashboard API returned unsuccessful response');
      }
      
      console.log(`✅ Admin dashboard loaded in ${meta.loadTime}ms (${meta.improvement})`);
      
      // ===== UPDATE ALL STATE FROM SINGLE RESPONSE =====
      
      // Set users data (already processed by API)
      setUsers(data.users as UserWithDetails[]);
      
      // Set pagination data
      setCurrentPage(data.pagination.currentPage);
      setTotalUsers(data.pagination.totalUsers);
      setTotalPages(data.pagination.totalPages);
      
      console.log(`👥 Loaded ${data.users.length} users on page ${page} of ${data.pagination.totalPages}`);
      console.log(`📊 Dashboard stats:`, data.statistics);
      
    } catch (error) {
      console.error("❌ Error loading optimized admin dashboard:", error);
      setError(GREEK_TEXT.errorFetchingUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers(1);
    }
  }, [isAuthenticated, isAdmin]);

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(GREEK_TEXT.confirmDelete)) {
      return;
    }

    setDeletingUserId(userId);
    setError("");

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
      } else {
        setError(result.error || GREEK_TEXT.errorDeletingUser);
      }

    } catch (error) {
      console.error("Error deleting user:", error);
      setError(GREEK_TEXT.errorOccurred);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateNewSession = async (user: UserWithDetails) => {
    // Find a child with active sessions to create a session for
    const activeChild = user.children.find(child => child.status === 'active');
    
    if (!activeChild) {
      alert('Δεν βρέθηκε ενεργό παιδί για τη δημιουργία συνεδρίας');
      return;
    }

    try {
      // Navigate to the folder manager where they can create sessions
      router.push(`/admin/students/${activeChild.$id}/folders`);
    } catch (error) {
      console.error('Error navigating to session creation:', error);
      alert('Σφάλμα κατά την πλοήγηση στη δημιουργία συνεδρίας');
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Navigation functions
  const goToFolderManager = async (user: UserWithDetails, student?: Student) => {
    // 👤 ADMIN AS STUDENT: Handle admin user specially
    if (user.isAdmin && !student) {
      try {
        console.log('🔧 Setting up admin as student for folder management...');
        const response = await fetch('/api/admin/admin-student');
        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Admin student created: ${data.data.studentId}`);
          // Navigate to admin folder management
          router.push(`/admin/students/${data.data.studentId}/folders`);
        } else {
          throw new Error(data.error || 'Failed to setup admin student');
        }
      } catch (error) {
        console.error('❌ Error setting up admin as student:', error);
        // Show error but don't break the UI
      }
      return;
    }
    
    // Regular student handling
    if (!student) {
      console.log("No student provided for folder management");
      return;
    }
    
    console.log(`Navigating to folder manager for student: ${student.name} (${student.$id})`);
    
    // Navigate to dedicated student folders page
    router.push(`/admin/students/${student.$id}/folders`);
  };

  const handleEditTherapyGoals = (user: UserWithDetails) => {
    // For now, let's navigate to the first child's therapy goals page
    // Later we can make this a modal or handle multiple children differently
    const firstChild = user.children.find(child => child.status === 'active') || user.children[0];
    
    if (!firstChild) {
      alert('Δεν βρέθηκε παιδί για επεξεργασία στόχων');
      return;
    }
    
    // Navigate to a therapy goals page - we'll create this next
    router.push(`/admin/students/${firstChild.$id}/therapy-goals`);
  };

  // 🚀 ENHANCED UI/UX: Optimized filtered users with debounced search and memoization
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return users;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone?.includes(debouncedSearchTerm) ||
      user.children.some(child => child.name.toLowerCase().includes(searchLower))
    );
  }, [users, debouncedSearchTerm]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{GREEK_TEXT.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-Friendly Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Back button and title */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                  <span className="leading-tight">
                    {GREEK_TEXT.adminTitle}
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {GREEK_TEXT.adminSubtitle}
                </p>
                    </div>
                  </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={() => router.push('/admin/settings')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Ρυθμίσεις</span>
              </Button>
            </div>
                    </div>
                  </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base"
          >
            {error}
          </motion.div>
        )}

      {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder={GREEK_TEXT.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-base"
                      />
                      {/* 🚀 ENHANCED UI/UX: Search debounce indicator */}
                      {searchTerm !== debouncedSearchTerm && searchTerm.length > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => fetchUsers(currentPage)} 
                      disabled={loading}
                      className="min-h-[48px] px-6 flex-shrink-0"
                    >
                      {loading ? GREEK_TEXT.loading : GREEK_TEXT.refresh}
                    </Button>
                </div>
                </CardContent>
              </Card>

              {/* Users List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? GREEK_TEXT.noUsersFound : GREEK_TEXT.noUsers}
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.$id} className="hover:shadow-lg transition-all duration-200 active:scale-[0.98] sm:active:scale-100">
                      <CardContent className="p-0">
                        {/* User Header - Mobile Optimized */}
                        <div 
                          className="p-4 sm:p-6 border-b border-gray-100 md:cursor-default cursor-pointer md:hover:bg-transparent hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            // Only make clickable on mobile
                            if (window.innerWidth < 768) {
                              toggleUserExpansion(user.$id);
                            }
                          }}
                        >
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                {user.extendedData?.profilePicture ? (
                                  <AvatarImage src={user.extendedData.profilePicture} alt={user.name} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm sm:text-base font-semibold">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{user.name}</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    {user.phone}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Baby className="w-3 h-3 flex-shrink-0" />
                                    {user.children.length} {GREEK_TEXT.children}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                                    {user.totalSessions} {GREEK_TEXT.sessions}
                                  </span>
                                </div>
                              </div>
                      </div>
                      
                            {/* Desktop-only buttons */}
                            <div className="hidden md:flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <Button
                                onClick={() => toggleUserExpansion(user.$id)}
                  variant="outline"
                  size="sm"
                                className="flex items-center gap-1 px-2 sm:px-3 py-2 min-h-[40px] text-xs sm:text-sm"
                              >
                                {expandedUsers.has(user.$id) ? (
                                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                                <span>{GREEK_TEXT.details}</span>
                </Button>
                              
                <Button
                                onClick={() => handleDeleteUser(user.$id)}
                  variant="outline"
                  size="sm"
                                disabled={deletingUserId === user.$id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-3 py-2 min-h-[40px]"
                              >
                                {deletingUserId === user.$id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                </Button>
            </div>
            
                            {/* Mobile-only expansion indicator */}
                            <div className="md:hidden flex items-center text-gray-400">
                              {expandedUsers.has(user.$id) ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </div>
                </div>
              </div>

                        {/* Expanded User Details - Mobile Optimized */}
                          {expandedUsers.has(user.$id) && (
            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 sm:p-6 bg-gray-50 space-y-4 sm:space-y-6">
                                {/* Parent Details Card - Mobile Optimized */}
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                                    {GREEK_TEXT.parentDetails}
                              </h4>
                                  <Card className="bg-white">
                                    <CardContent className="p-3 sm:p-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.fullName}</label>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">{user.name}</p>
                      </div>
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.email}</label>
                                            <p className="font-medium text-gray-900 flex items-center text-sm sm:text-base break-all">
                                              <Mail className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                                              {user.email}
                                            </p>
                      </div>
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.phone}</label>
                                            <p className="font-medium text-gray-900 flex items-center text-sm sm:text-base">
                                              <Phone className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                                              {user.phone}
                                            </p>
                        </div>
                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.registrationDate}</label>
                                            <p className="font-medium text-gray-900 flex items-center text-sm sm:text-base">
                                              <Calendar className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                                              {new Date(user.registration).toLocaleDateString('el-GR')}
                                            </p>
                          </div>
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.userId}</label>
                                            <p className="font-mono text-xs sm:text-sm text-gray-600 break-all">{user.$id}</p>
                        </div>
                                          <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.address}</label>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                                              {user.extendedData?.address || GREEK_TEXT.notProvided}
                                            </p>
                      </div>
                      </div>
                </div>
                                      
                                      {/* Statistics - Mobile Grid */}
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                          <div>
                                            <p className="text-lg sm:text-xl font-bold text-blue-600">{user.children.length}</p>
                                            <p className="text-xs text-gray-600">{GREEK_TEXT.children}</p>
              </div>
                                          <div>
                                            <p className="text-lg sm:text-xl font-bold text-green-600">{user.totalSessions}</p>
                                            <p className="text-xs text-gray-600">{GREEK_TEXT.totalSessions}</p>
        </div>
                                          <div>
                                            <p className="text-lg sm:text-xl font-bold text-orange-600">
                                              {user.children.filter(c => c.status === 'active').length}
                                            </p>
                                            <p className="text-xs text-gray-600">{GREEK_TEXT.activeChildren}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Children Details - Mobile Optimized */}
                <div>
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                                    <Baby className="w-4 h-4 mr-2 text-green-600" />
                                    {GREEK_TEXT.childrenDetails} ({user.children.length})
                                  </h4>
                                  {user.children.length === 0 ? (
                                    <Card className="bg-white">
                                      <CardContent className="p-6 sm:p-8 text-center">
                                        {user.isAdmin ? (
                                          /* 👤 ADMIN USER: Special admin practice interface */
                                          <>
                                            <Settings className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mx-auto mb-4" />
                                            <p className="text-blue-700 text-sm sm:text-base font-medium">
                                              Λογαριασμός Διαχειριστή
                                            </p>
                                            <p className="text-xs sm:text-sm text-blue-600 mt-1 mb-4">
                                              Χρησιμοποιήστε το σύστημα για εκπαίδευση
                                            </p>
                                            <Button
                                              onClick={() => goToFolderManager(user)}
                                              size="sm"
                                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                                            >
                                              <FolderOpen className="w-4 h-4" />
                                              <span className="text-sm font-medium">Διαχείριση Φακέλων (Admin)</span>
                                            </Button>
                                          </>
                                        ) : (
                                          /* Regular user with no children */
                                          <>
                                            <Baby className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 text-sm sm:text-base">{GREEK_TEXT.noChildren}</p>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">{GREEK_TEXT.childrenWillAppear}</p>
                                          </>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <div className="space-y-4">
                                      {user.children.map((child) => (
                                        <Card key={child.$id} className="bg-white">
                                          <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                                  <Baby className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                                                <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{child.name}</h5>
                                              </div>
                                              <Badge variant={child.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                {child.status === 'active' ? GREEK_TEXT.active : GREEK_TEXT.inactive}
                                              </Badge>
              </div>

                                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                                              <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.age}</label>
                                                <p className="font-medium text-gray-900 text-sm">{child.age} {GREEK_TEXT.yearsOld}</p>
                            </div>
                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.status}</label>
                                                <p className="font-medium text-gray-900 capitalize text-sm">{child.status === 'active' ? GREEK_TEXT.active : GREEK_TEXT.inactive}</p>
                            </div>
                                              <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.joinDate}</label>
                                                <p className="font-medium text-gray-900 text-sm">{new Date(child.joinDate).toLocaleDateString('el-GR')}</p>
                          </div>
                                              <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.studentId}</label>
                                                <p className="font-mono text-xs text-gray-600">{child.$id.slice(-8)}</p>
                                              </div>
                        </div>

                                            {child.dateOfBirth && (
                        <div className="mb-4">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{GREEK_TEXT.dateOfBirth}</label>
                                                <p className="font-medium text-gray-900 text-sm">{new Date(child.dateOfBirth).toLocaleDateString('el-GR')}</p>
                          </div>
                                            )}
                                            
                                            <div className="pt-3 border-t border-gray-100">
                                              <Button
                                                onClick={() => goToFolderManager(user, child)}
                                                size="sm"
                                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                                              >
                                                <FolderOpen className="w-4 h-4" />
                                                <span className="text-sm font-medium">{GREEK_TEXT.manageSessionFolders}</span>
                                              </Button>
                          </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                        </div>
                                  )}
                        </div>

                                {/* Quick Actions - Mobile Grid */}
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                                    <Settings className="w-4 h-4 mr-2 text-purple-600" />
                                    {GREEK_TEXT.quickActions}
                                  </h4>
                                  <Card className="bg-white">
                                    <CardContent className="p-3 sm:p-4">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                        <Button
                                          onClick={() => handleCreateNewSession(user)}
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm"
                                          disabled={user.children.length === 0 || !user.children.some(child => child.status === 'active')}
                                        >
                                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>Νέα Συνεδρία</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm"
                                          onClick={() => window.open(`tel:${user.phone}`, '_self')}
                                        >
                                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>{GREEK_TEXT.call}</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm"
                                          onClick={() => window.open(`mailto:${user.email}`, '_self')}
                                        >
                                          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>{GREEK_TEXT.emailAction}</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                          onClick={() => handleEditTherapyGoals(user)}
                                          disabled={user.children.length === 0}
                                        >
                                          <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>Θεραπευτικοί Στόχοι</span>
                                        </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Delete User Section - Always visible in expanded view */}
                    <Card className="mt-4 border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-red-800 text-sm">Επικίνδυνη Ζώνη</h4>
                            <p className="text-xs text-red-600 mt-1">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί</p>
                          </div>
                          <Button
                            onClick={() => handleDeleteUser(user.$id)}
                            variant="outline"
                            size="sm"
                            disabled={deletingUserId === user.$id}
                            className="text-red-600 border-red-300 hover:text-red-700 hover:bg-red-100 hover:border-red-400"
                          >
                            {deletingUserId === user.$id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Διαγραφή...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Διαγραφή Χρήστη
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
              </div>
            </div>
                                                        </motion.div>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                        </div>
              )}
            </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Σελίδα {currentPage} από {totalPages} • Σύνολο {totalUsers} χρήστες
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Προηγούμενη
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Επόμενη
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics - Mobile Friendly */}
        {!loading && filteredUsers.length > 0 && (
          <Card className="mt-6 sm:mt-8">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalUsers}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.totalUsers}</p>
        </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {users.reduce((acc, user) => acc + user.children.length, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.totalChildren}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {users.reduce((acc, user) => acc + user.totalSessions, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.totalSessions}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {users.filter(user => user.children.length > 0).length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.activeParents}</p>
        </div>
        </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Card */}
        <TutorialCard
          title="Οδηγός Διαχείρισης Χρηστών"
          description="Μάθετε πώς να διαχειρίζεστε χρήστες, γονείς, παιδιά και φακέλους συνεδριών με αποτελεσματικό τρόπο."
          steps={[
            {
              title: "Αναζήτηση Χρηστών",
              description: "Χρησιμοποιήστε το πεδίο αναζήτησης για να βρείτε γονείς ή παιδιά με όνομα, email ή τηλέφωνο.",
              action: "Πληκτρολογήστε στο πεδίο αναζήτησης παραπάνω"
            },
            {
              title: "Διαχείριση Φακέλων",
              description: "Κάντε κλικ στο κουμπί 'Λεπτομέρειες' για να δείτε τα παιδιά κάθε γονέα και στη συνέχεια 'Διαχείριση Φακέλων'.",
              action: "Βρείτε έναν γονέα και κάντε κλικ στα 3 κουκκίδια ή το κουμπί λεπτομερειών"
            },
            {
              title: "Προσθήκη Νέων Φακέλων",
              description: "Μέσα στη διαχείριση φακέλων, κάντε κλικ 'Νέος Φάκελος' για να δημιουργήσετε θεραπευτικά προγράμματα.",
              action: "Επιλέξτε αριθμό εβδομάδων και συνεδρίες ανά εβδομάδα"
            },
            {
              title: "Ρυθμίσεις Συστήματος",
              description: "Χρησιμοποιήστε το κουμπί 'Ρυθμίσεις' για να διαχειριστείτε τα μηνύματα banner και να αποσυνδεθείτε.",
              action: "Κάντε κλικ στο κουμπί 'Ρυθμίσεις' επάνω δεξιά"
            }
          ]}
        />
      </div>
      
    </div>
  );
}

export default AdminPage;