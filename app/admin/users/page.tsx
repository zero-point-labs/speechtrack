"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { Users, Search, Trash2, Eye, Phone, Mail, Calendar, Baby, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) {
    return 0;
  }
  
  const birth = new Date(dateOfBirth);
  
  // Check if the date is valid
  if (isNaN(birth.getTime())) {
    return 0;
  }
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure age is not negative
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

interface UserWithDetails extends AppwriteUser {
  extendedData?: UserExtended;
  children: Student[];
  totalSessions: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
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

      // Get all users from users_extended (parent users only)
      // FALLBACK: Handle case where env vars aren't loaded on client
      const usersExtendedCollectionId = (appwriteConfig.collections as any).usersExtended || '68aef5f19770fc264f6d';
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

      // Count sessions per parent (through their children)
      const sessionsByParent = sessionsResult.documents.reduce((acc, session) => {
        // Find which parent this session belongs to
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
        
        // Process children to calculate ages
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
              `Γονέας του ${userChildren[0].name}` : // Parent of [child name] 
              `Χρήστης ${typedExtData.userId.slice(-8)}`), // Fallback to User ID
          email: typedExtData.email || `${typedExtData.phone}@example.com`, // Use stored email or phone fallback
          phone: typedExtData.phone,
          registration: typedExtData.createdAt,
          status: true,
          extendedData: typedExtData,
          children: userChildren,
          totalSessions: sessionsByParent[typedExtData.userId] || 0
        };
      });

      setUsers(usersWithDetails);

    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Αποτυχία φόρτωσης χρηστών");
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
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη; Αυτή η ενέργεια θα διαγράψει όλα τα δεδομένα του (παιδιά, συνεδρίες, μηνύματα) και δεν μπορεί να αναιρεθεί.")) {
      return;
    }

    setDeletingUserId(userId);
    setError("");

    try {
      // This would call our CASCADE deletion API
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the list
      } else {
        setError(result.error || "Αποτυχία διαγραφής χρήστη");
      }

    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Προέκυψε σφάλμα κατά τη διαγραφή");
    } finally {
      setDeletingUserId(null);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (will redirect)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Διαχείριση Χρηστών
              </h1>
              <p className="text-gray-600">Προβολή και διαχείριση όλων των γονέων και των παιδιών τους</p>
            </div>
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>Επιστροφή στο Admin</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Αναζήτηση χρηστών, email, τηλέφωνο ή όνομα παιδιού..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button onClick={fetchUsers} disabled={loading}>
                {loading ? "Φόρτωση..." : "Ανανέωση"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Δεν βρέθηκαν χρήστες" : "Δεν υπάρχουν χρήστες"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Δοκιμάστε διαφορετικούς όρους αναζήτησης"
                  : "Οι νέοι χρήστες θα εμφανιστούν εδώ μετά την εγγραφή τους"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {user.$id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Εγγραφή: {new Date(user.registration).toLocaleDateString('el-GR')}
                        </span>
                      </div>
                    </div>

                    {/* Children Count */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Baby className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {user.children.length} Παιδί/ά
                        </span>
                      </div>
                      <span className="text-xs text-blue-600">
                        {user.totalSessions} Συνεδρίες
                      </span>
                    </div>

                    {/* Children List */}
                    {user.children.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Παιδιά:</p>
                        {user.children.slice(0, 3).map((child) => (
                          <div key={child.$id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{child.name}</span>
                            <span className="text-gray-500">{child.age} ετών</span>
                          </div>
                        ))}
                        {user.children.length > 3 && (
                          <p className="text-xs text-gray-500">+{user.children.length - 3} περισσότερα</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => router.push(`/admin/users/${user.$id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Προβολή</span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.$id)}
                        variant="outline"
                        size="sm"
                        disabled={deletingUserId === user.$id}
                        className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingUserId === user.$id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Διαγραφή</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredUsers.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                  <p className="text-sm text-gray-600">Συνολικοί Χρήστες</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {users.reduce((acc, user) => acc + user.children.length, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Συνολικά Παιδιά</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {users.reduce((acc, user) => acc + user.totalSessions, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Συνολικές Συνεδρίες</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(user => user.children.length > 0).length}
                  </p>
                  <p className="text-sm text-gray-600">Ενεργοί Γονείς</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
