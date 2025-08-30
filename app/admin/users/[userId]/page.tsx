"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  Users, ArrowLeft, Phone, Mail, Calendar, Baby, BookOpen, 
  Clock, CheckCircle, XCircle, Trash2, Plus, AlertTriangle, Trophy 
} from "lucide-react";
import { motion } from "framer-motion";

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) {
    throw new Error('dateOfBirth is required');
  }
  
  const birth = new Date(dateOfBirth);
  
  // Check if the date is valid
  if (isNaN(birth.getTime())) {
    console.error('Invalid date format:', dateOfBirth);
    throw new Error('Invalid date format');
  }
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  // Ensure age is reasonable (between 0 and 18 for speech therapy)
  if (age < 0 || age > 18) {
    console.warn('Calculated age seems unreasonable:', age, 'for birth date:', dateOfBirth);
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

interface Student {
  $id: string;
  name: string;
  age: number;
  dateOfBirth?: string;
  parentId: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
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

interface Message {
  $id: string;
  studentId: string;
  content: string;
  isFromParent: boolean;
  isRead: boolean;
  priority: string;
  $createdAt: string;
}

interface UserDetails {
  userId: string;
  extendedData?: UserExtended;
  children: Student[];
  sessions: Session[];
  // messages: Message[]; // DISABLED - Collection removed
}

export default function UserDetailPage() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);
  
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      // FALLBACK: Handle case where env vars aren't loaded on client
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';
      const usersExtendedCollectionId = appwriteConfig.collections.usersExtended || '68aef5f19770fc264f6d';
      const studentsCollectionId = appwriteConfig.collections.students || '68ac213b9a91cd95a008';
      const sessionsCollectionId = appwriteConfig.collections.sessions || '68ab99a82b7fbc5dd564';
      // const messagesCollectionId = appwriteConfig.collections.messages || '68ab99c9b8022bf3a148'; // DISABLED

      // Get user extended data
      const userExtendedResult = await databases.listDocuments(
        databaseId,
        usersExtendedCollectionId,
        [Query.equal('userId', userId)]
      );

      // Get user's children
      const childrenResult = await databases.listDocuments(
        databaseId,
        studentsCollectionId,
        [Query.equal('parentId', userId), Query.orderDesc('$createdAt')]
      );

      // Get all sessions for these children
      const childrenIds = childrenResult.documents.map(child => child.$id);
      let sessions: Session[] = [];
      
      if (childrenIds.length > 0) {
        const sessionsResult = await databases.listDocuments(
          databaseId,
          sessionsCollectionId,
          [Query.equal('studentId', childrenIds), Query.orderDesc('date'), Query.limit(100)]
        );
        sessions = sessionsResult.documents as Session[];
      }

      // Messages functionality disabled - collection was removed

      setUserDetails({
        userId,
        extendedData: userExtendedResult.documents[0] as UserExtended,
        children: childrenResult.documents as Student[],
        sessions
        // messages // DISABLED
      });

    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Αποτυχία φόρτωσης στοιχείων χρήστη");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin && userId) {
      fetchUserDetails();
    }
  }, [isAuthenticated, isAdmin, userId]);

  const handleDeleteUser = async () => {
    if (!userDetails) return;

    const childrenCount = userDetails.children.length;
    const sessionsCount = userDetails.sessions.length;

    const confirmMessage = `Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη;

Αυτή η ενέργεια θα διαγράψει:
• ${childrenCount} παιδί/ά
• ${sessionsCount} συνεδρίες
• Όλα τα σχετικά αρχεία

Αυτή η ενέργεια δεν μπορεί να αναιρεθεί!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingUser(true);
    setError("");

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin/users");
      } else {
        setError(result.error || "Αποτυχία διαγραφής χρήστη");
      }

    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Προέκυψε σφάλμα κατά τη διαγραφή");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCreateSession = (studentId: string) => {
    router.push(`/admin/create-session?studentId=${studentId}`);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Σφάλμα Φόρτωσης</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/admin/users")}>
              Επιστροφή στους Χρήστες
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/admin/users")}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Πίσω</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Users className="w-8 h-8 mr-3 text-blue-600" />
                  Στοιχεία Χρήστη
                </h1>
                <p className="text-gray-600">ID: {userId}</p>
              </div>
            </div>
            <Button
              onClick={handleDeleteUser}
              variant="outline"
              disabled={deletingUser}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deletingUser ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{deletingUser ? "Διαγραφή..." : "Διαγραφή Χρήστη"}</span>
            </Button>
          </div>
        </div>

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

        {userDetails && (
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Στοιχεία Γονέα</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parent Identity */}
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    Προσωπικά Στοιχεία
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Όνομα</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.extendedData?.name || "Δεν έχει οριστεί"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.extendedData?.email || "Δεν έχει οριστεί"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Τηλέφωνο</p>
                        <p className="font-medium text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {userDetails.extendedData?.phone || "Δεν έχει οριστεί"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Διεύθυνση</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.extendedData?.address || "Δεν έχει οριστεί"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Ημερομηνία Εγγραφής</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.extendedData?.createdAt 
                            ? new Date(userDetails.extendedData.createdAt).toLocaleDateString('el-GR')
                            : "Δεν έχει οριστεί"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Τελευταία Σύνδεση</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.extendedData?.lastLoginAt 
                            ? new Date(userDetails.extendedData.lastLoginAt).toLocaleDateString('el-GR')
                            : "Δεν έχει οριστεί"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Baby className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Αριθμός Παιδιών</p>
                        <p className="font-medium text-gray-900">{userDetails.children.length} Παιδί/ά</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Συνολικές Συνεδρίες</p>
                        <p className="font-medium text-gray-900">{userDetails.sessions.length} Συνεδρίες</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Children Cards */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Baby className="w-5 h-5 mr-2 text-blue-600" />
                Παιδιά ({userDetails.children.length})
              </h2>
              
              {userDetails.children.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Δεν έχουν καταχωρηθεί παιδιά</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userDetails.children.map((child) => {
                    const childSessions = userDetails.sessions.filter(s => s.studentId === child.$id);
                    const completedSessions = childSessions.filter(s => s.status === 'completed').length;
                    
                    return (
                      <Card key={child.$id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{child.name}</span>
                            <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                              {child.status === 'active' ? 'Ενεργό' : 'Ανενεργό'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Ηλικία:</span>
                            <span className="font-medium">
                              {(() => {
                                console.log('Child data:', child.name, {
                                  dateOfBirth: child.dateOfBirth,
                                  age: child.age,
                                  $id: child.$id
                                });
                                
                                if (child.dateOfBirth) {
                                  try {
                                    const calculatedAge = calculateAge(child.dateOfBirth);
                                    console.log(`Calculated age for ${child.name}:`, calculatedAge);
                                    return `${calculatedAge} ετών`;
                                  } catch (error) {
                                    console.error('Error calculating age:', error);
                                    return child.age ? `${child.age} ετών` : 'Σφάλμα υπολογισμού';
                                  }
                                } else if (child.age) {
                                  return `${child.age} ετών`;
                                } else {
                                  return 'Δεν έχει οριστεί';
                                }
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Συνεδρίες:</span>
                            <span className="font-medium">{completedSessions}/{childSessions.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Εγγραφή:</span>
                            <span className="font-medium">
                              {new Date(child.joinDate).toLocaleDateString('el-GR')}
                            </span>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-100">
                            <Button
                              onClick={() => handleCreateSession(child.$id)}
                              size="sm"
                              className="w-full flex items-center justify-center space-x-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Νέα Συνεδρία</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Πρόσφατες Συνεδρίες ({userDetails.sessions.length})
              </h2>
              
              {userDetails.sessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Δεν έχουν προγραμματιστεί συνεδρίες</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-4 font-medium text-gray-700">Παιδί</th>
                            <th className="text-left p-4 font-medium text-gray-700">Τίτλος</th>
                            <th className="text-left p-4 font-medium text-gray-700">Ημερομηνία</th>
                            <th className="text-left p-4 font-medium text-gray-700">Κατάσταση</th>
                            <th className="text-left p-4 font-medium text-gray-700">Διάρκεια</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.sessions.slice(0, 10).map((session) => {
                            const child = userDetails.children.find(c => c.$id === session.studentId);
                            return (
                              <tr key={session.$id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-4 text-sm">{child?.name || 'Άγνωστο'}</td>
                                <td className="p-4 text-sm font-medium">{session.title}</td>
                                <td className="p-4 text-sm">
                                  {new Date(session.date).toLocaleDateString('el-GR')}
                                </td>
                                <td className="p-4">
                                  <Badge 
                                    variant={
                                      session.status === 'completed' ? 'default' : 
                                      session.status === 'available' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {session.status === 'completed' ? 'Ολοκληρώθηκε' :
                                     session.status === 'available' ? 'Διαθέσιμη' :
                                     session.status === 'locked' ? 'Κλειδωμένη' : session.status}
                                  </Badge>
                                </td>
                                <td className="p-4 text-sm">{session.duration}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {userDetails.sessions.length > 10 && (
                      <div className="p-4 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                          Εμφάνιση 10 από {userDetails.sessions.length} συνεδρίες
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Messages functionality disabled - collection was removed */}
            
            {/* Achievement Journey Management */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Διαχείριση Επιτευγμάτων
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userDetails.children.map((child) => (
                  <Card key={child.$id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{child.name}</span>
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Δημιουργήστε και προσαρμόστε το ταξίδι επιτευγμάτων για τον {child.name} με προσαρμοσμένα βήματα, ανάθεση συνεδριών και ανταμοιβές τροπαίων.
                      </p>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <Button
                          onClick={() => router.push(`/admin/students/${child.$id}/achievement-builder?userId=${userId}`)}
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white flex items-center justify-center space-x-1"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>Διαχείριση Επιτευγμάτων</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {userDetails.children.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="p-8 text-center">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Προσθέστε παιδιά για να δημιουργήσετε ταξίδια επιτευγμάτων
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
