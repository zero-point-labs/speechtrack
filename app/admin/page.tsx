"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Home
} from "lucide-react";
import { motion } from "framer-motion";

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
}



function AdminPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Get all users from users_extended
      const usersExtendedCollectionId = appwriteConfig.collections.usersExtended || '68aef5f19770fc264f6d';
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';
      
      const usersExtendedResult = await databases.listDocuments(
        databaseId,
        usersExtendedCollectionId,
        [Query.orderDesc('createdAt'), Query.limit(100)]
      );

      // Get all students to count children per parent
      const studentsCollectionId = appwriteConfig.collections.students || '68ac213b9a91cd95a008';
      const studentsResult = await databases.listDocuments(
        databaseId,
        studentsCollectionId,
        [Query.limit(1000)]
      );

      // Get all sessions to count total sessions per parent
      const sessionsCollectionId = appwriteConfig.collections.sessions || '68ab99a82b7fbc5dd564';
      const sessionsResult = await databases.listDocuments(
        databaseId,
        sessionsCollectionId,
        [Query.limit(1000)]
      );

      // Group students by parentId
      const studentsByParent = studentsResult.documents.reduce((acc, student) => {
        const typedStudent = student as unknown as Student;
        if (typedStudent.parentId) {
          if (!acc[typedStudent.parentId]) acc[typedStudent.parentId] = [];
          acc[typedStudent.parentId].push(typedStudent);
        }
        return acc;
      }, {} as Record<string, Student[]>);

      // Count sessions per parent
      const sessionsByParent = sessionsResult.documents.reduce((acc, session) => {
        const student = studentsResult.documents.find(s => s.$id === session.studentId) as unknown as Student;
        if (student && student.parentId) {
          if (!acc[student.parentId]) acc[student.parentId] = 0;
          acc[student.parentId]++;
        }
        return acc;
      }, {} as Record<string, number>);

      // Build user list with details
      const usersWithDetails: UserWithDetails[] = usersExtendedResult.documents.map((extData) => {
        const typedExtData = extData as unknown as UserExtended;
        const rawChildren = studentsByParent[typedExtData.userId] || [];
        
        const userChildren = rawChildren.map(child => {
          const typedChild = child as unknown as Student;
          return {
            ...typedChild,
            age: typedChild.dateOfBirth ? calculateAge(typedChild.dateOfBirth) : (typedChild.age || 0)
          };
        });
        
        return {
          $id: typedExtData.userId,
          name: typedExtData.name || 
            (userChildren.length > 0 ? 
              `Γονέας του ${userChildren[0].name}` : 
              `Χρήστης ${typedExtData.userId.slice(-8)}`),
          email: typedExtData.email || `${typedExtData.phone}@example.com`,
          phone: typedExtData.phone,
          registration: typedExtData.createdAt,
          status: true,
          extendedData: typedExtData,
          children: userChildren,
          sessions: [], // Will be loaded when needed
          totalSessions: sessionsByParent[typedExtData.userId] || 0
        };
      });

      setUsers(usersWithDetails);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(GREEK_TEXT.errorFetchingUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin]);

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
  const goToFolderManager = (user: UserWithDetails, student: Student) => {
    // Navigate to dedicated student folders page
    router.push(`/admin/students/${student.$id}/folders`);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.children.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                onClick={() => router.push("/dashboard")}
                variant="outline"
                              size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </Button>
              <Button
                onClick={() => router.push("/admin/users")}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.userList}</span>
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
                    </div>
                    <Button 
                      onClick={fetchUsers} 
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
                        <div className="p-4 sm:p-6 border-b border-gray-100">
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
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
                      
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
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
                                        <Baby className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-sm sm:text-base">{GREEK_TEXT.noChildren}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{GREEK_TEXT.childrenWillAppear}</p>
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
                                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <Button
                                          onClick={() => router.push(`/admin/users/${user.$id}`)}
                                          variant="outline"
                            size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm"
                                        >
                                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>{GREEK_TEXT.fullDetails}</span>
                                        </Button>
                                        <Button
                                          onClick={() => router.push(`/admin/create-student?parentId=${user.$id}`)}
                            variant="outline"
                                          size="sm"
                                          className="flex items-center justify-center gap-1 min-h-[44px] text-xs sm:text-sm"
                          >
                                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>{GREEK_TEXT.addChild}</span>
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

        {/* Summary Statistics - Mobile Friendly */}
        {!loading && filteredUsers.length > 0 && (
          <Card className="mt-6 sm:mt-8">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{users.length}</p>
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
      </div>
    </div>
  );
}

export default AdminPage;