"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Save, AlertTriangle, Copy, 
  Folder, FolderOpen, FolderPlus, Plus
} from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  $id: string;
  name: string;
  age?: number;
  parentId: string;
  status: string;
}

// Session template interface
interface SessionTemplate {
  dayOfWeek: string;
  time: string;
  duration: number; // in minutes
}

// Session setup form data
interface SessionSetupData {
  totalWeeks: number;
  sessionsPerWeek: number;
  sessionTemplates: SessionTemplate[];
}

// Success state interface
interface CreatedSessions {
  count: number;
  studentName: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Δευτέρα' },
  { value: 'tuesday', label: 'Τρίτη' },
  { value: 'wednesday', label: 'Τετάρτη' },
  { value: 'thursday', label: 'Πέμπτη' },
  { value: 'friday', label: 'Παρασκευή' },
  { value: 'saturday', label: 'Σάββατο' },
  { value: 'sunday', label: 'Κυριακή' }
];

const DURATION_OPTIONS = [30, 45, 60, 90];

function CreateSessionContent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);
  const [sessionFolders, setSessionFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdSessions, setCreatedSessions] = useState<CreatedSessions | null>(null);
  
  const [sessionSetup, setSessionSetup] = useState<SessionSetupData>({
    totalWeeks: 4,
    sessionsPerWeek: 1,
    sessionTemplates: [{
      dayOfWeek: 'monday',
      time: '10:00',
      duration: 60
    }]
  });

  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const folderId = searchParams.get('folderId'); // New: support direct folder selection

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Fetch student and existing sessions
  useEffect(() => {
    if (isAuthenticated && isAdmin && studentId) {
      fetchStudentAndSessions();
    }
  }, [isAuthenticated, isAdmin, studentId]);

  const fetchStudentAndSessions = async () => {
    if (!studentId) {
      setError("Δεν βρέθηκε ID μαθητή");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // FALLBACK: Handle case where env vars aren't loaded on client
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';
      const studentsCollectionId = (appwriteConfig.collections as any).students || '68ac213b9a91cd95a008';
      const sessionsCollectionId = (appwriteConfig.collections as any).sessions || '68ab99a82b7fbc5dd564';

      // Get student details
      const studentResult = await databases.getDocument(
        databaseId,
        studentsCollectionId,
        studentId
      );

      // Get session folders for this student
      const foldersResponse = await fetch(`/api/admin/session-folders?studentId=${studentId}`);
      const foldersData = await foldersResponse.json();
      
      if (foldersData.success) {
        setSessionFolders(foldersData.folders || []);
        
        // Auto-select folder if provided in URL or if there's an active folder
        if (folderId) {
          setSelectedFolderId(folderId);
        } else {
          const activeFolder = foldersData.folders?.find((f: any) => f.isActive);
          if (activeFolder) {
            setSelectedFolderId(activeFolder.$id);
          }
        }
      }

      // Get existing sessions for this student (all folders for context)
      const sessionsResult = await databases.listDocuments(
        databaseId,
        sessionsCollectionId,
        [
          Query.equal('studentId', studentId),
          Query.orderDesc('sessionNumber'),
          Query.limit(100)
        ]
      );

      setStudent(studentResult as unknown as Student);
      setExistingSessions(sessionsResult.documents);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Αποτυχία φόρτωσης στοιχείων μαθητή");
    } finally {
      setLoading(false);
    }
  };

  // Handle session setup changes
  const handleWeeksChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const weeks = parseInt(e.target.value) || 4;
    setSessionSetup(prev => ({ 
      ...prev, 
      totalWeeks: weeks 
    }));
  }, []);

  const handleSessionsPerWeekChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessions = parseInt(e.target.value);
    setSessionSetup(prev => {
      const currentTemplates = prev.sessionTemplates;
      let newTemplates: SessionTemplate[];

      if (sessions > currentTemplates.length) {
        // Add new templates
        newTemplates = [...currentTemplates];
        for (let i = currentTemplates.length; i < sessions; i++) {
          newTemplates.push({
            dayOfWeek: 'monday',
            time: '10:00',
            duration: 45
          });
        }
      } else {
        // Remove excess templates
        newTemplates = currentTemplates.slice(0, sessions);
      }

      return {
        ...prev,
        sessionsPerWeek: sessions,
        sessionTemplates: newTemplates
      };
    });
  }, []);

  // Handle individual session template changes
  const handleTemplateChange = useCallback((index: number, field: keyof SessionTemplate, value: string | number) => {
    setSessionSetup(prev => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    }));
  }, []);

  const getNextSessionNumber = () => {
    if (!selectedFolderId) {
      // If no folder selected, use global session numbering (fallback)
      if (existingSessions.length === 0) return 1;
      const highestNumber = Math.max(...existingSessions.map(session => session.sessionNumber || 0));
      return highestNumber + 1;
    }
    
    // Get sessions in the selected folder only
    const folderSessions = existingSessions.filter(session => session.folderId === selectedFolderId);
    if (folderSessions.length === 0) return 1;
    
    const highestNumber = Math.max(...folderSessions.map(session => session.sessionNumber || 0));
    return highestNumber + 1;
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !studentId) {
      setError("Folder name is required");
      return;
    }

    try {
      const response = await fetch('/api/admin/session-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          name: newFolderName.trim(),
          description: `Session folder for ${sessionSetup.totalWeeks} weeks program`,
          setActive: sessionFolders.length === 0 // Set as active if it's the first folder
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh folders and select the new one
        await fetchStudentAndSessions();
        setSelectedFolderId(data.folder.$id);
        setNewFolderName('');
        setShowCreateFolder(false);
        setError('');
      } else {
        setError(data.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setError("Failed to create folder");
    }
  };

  const handleCreateSessions = useCallback(async () => {
    if (!student || !studentId) return;

    // Validation
    if (sessionSetup.totalWeeks < 1 || sessionSetup.totalWeeks > 52) {
      setError('Οι εβδομάδες πρέπει να είναι μεταξύ 1 και 52');
      return;
    }

    if (sessionSetup.sessionsPerWeek < 1 || sessionSetup.sessionsPerWeek > 7) {
      setError('Οι συνεδρίες ανά εβδομάδα πρέπει να είναι μεταξύ 1 και 7');
      return;
    }

    if (!selectedFolderId) {
      setError('Παρακαλώ επιλέξτε ένα φάκελο συνεδριών ή δημιουργήστε νέο');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      // FALLBACK: Handle case where env vars aren't loaded on client
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';
      const sessionsCollectionId = (appwriteConfig.collections as any).sessions || '68ab99a82b7fbc5dd564';

      // Create sessions based on templates
      const sessions = [];
      const startDate = new Date();
      const startingSessionNumber = getNextSessionNumber();
      
      for (let week = 0; week < sessionSetup.totalWeeks; week++) {
        for (let sessionIndex = 0; sessionIndex < sessionSetup.sessionsPerWeek; sessionIndex++) {
          const template = sessionSetup.sessionTemplates[sessionIndex];
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + (week * 7));
          
          const sessionNumber = startingSessionNumber + (week * sessionSetup.sessionsPerWeek) + sessionIndex;
          
          sessions.push({
            studentId: studentId,
            folderId: selectedFolderId, // NEW: Add folder ID
            sessionNumber: sessionNumber,
            title: `Συνεδρία ${sessionNumber}`,
            description: `Αυτόματη συνεδρία - ${template.duration} λεπτά`,
            date: sessionDate.toISOString(),
            duration: `${template.duration} λεπτά`,
            status: 'locked', // All sessions start as locked
            isPaid: false,
            therapistNotes: null
          });
        }
      }

      // Create all sessions
      console.log(`Creating ${sessions.length} sessions for student ${student.name} in folder ${selectedFolderId}...`);
      for (let i = 0; i < sessions.length; i++) {
        const sessionData = sessions[i];
        await databases.createDocument(
          databaseId,
          sessionsCollectionId,
          'unique()',
          sessionData
        );
        
        // Log progress for large batches
        if (sessions.length > 10 && (i + 1) % 10 === 0) {
          console.log(`Created ${i + 1}/${sessions.length} sessions...`);
        }
      }
      console.log(`✅ Successfully created all ${sessions.length} sessions!`);

      // Update folder statistics
      try {
        await fetch(`/api/admin/session-folders/${selectedFolderId}`, {
          method: 'GET' // This will trigger stats update
        });
      } catch (error) {
        console.warn('Failed to update folder stats:', error);
      }

      // Success! Show completion message
      setCreatedSessions({
        count: sessions.length,
        studentName: student.name
      });
      
    } catch (error: unknown) {
      console.error('Error creating sessions:', error);
      setError(error instanceof Error ? error.message : 'Σφάλμα κατά τη δημιουργία των συνεδριών');
    } finally {
      setSaving(false);
    }
  }, [sessionSetup, student, studentId, selectedFolderId, existingSessions]);

  const handleCreateAnother = useCallback(() => {
    setCreatedSessions(null);
    setError('');
    setSessionSetup({
      totalWeeks: 12,
      sessionsPerWeek: 1,
      sessionTemplates: [{
        dayOfWeek: 'monday',
        time: '10:00',
        duration: 45
      }]
    });
    // Refresh existing sessions
    fetchStudentAndSessions();
  }, [fetchStudentAndSessions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'locked': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'locked': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Διαθέσιμη';
      case 'completed': return 'Ολοκληρώθηκε';
      case 'locked': return 'Κλειδωμένη';
      case 'cancelled': return 'Ακυρώθηκε';
      default: return status;
    }
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

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // Success view
  if (createdSessions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Επιτυχία!</h1>
              <p className="text-gray-600">Οι συνεδρίες δημιουργήθηκαν επιτυχώς</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Στοιχεία Συνεδριών</h3>
                <p className="text-blue-800"><strong>Μαθητής:</strong> {createdSessions.studentName}</p>
                <p className="text-blue-800"><strong>Συνεδρίες:</strong> {createdSessions.count}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Επόμενα Βήματα</h3>
                <p className="text-sm text-green-700">
                  Οι συνεδρίες δημιουργήθηκαν και είναι έτοιμες για χρήση. Η πρώτη συνεδρία είναι διαθέσιμη, οι υπόλοιπες είναι κλειδωμένες.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleCreateAnother}
                variant="outline"
                className="flex-1"
              >
                Νέο Πρόγραμμα
              </Button>
              <Button
                onClick={() => student ? router.push(`/admin/users/${student.parentId}`) : router.push('/admin')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Επιστροφή
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-gray-200 rounded-lg h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Σφάλμα Φόρτωσης</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/admin')}>
              Επιστροφή στο Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => student ? router.push(`/admin/users/${student.parentId}`) : router.push('/admin')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Πίσω</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-8 h-8 mr-3 text-purple-600" />
                  Ρύθμιση Συνεδριών
                </h1>
                {student && (
                  <p className="text-gray-600">
                    Δημιουργία προγράμματος συνεδριών για: <span className="font-medium">{student.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </motion.div>
        )}

        {/* Folder Selection Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              <span>Επιλογή Φακέλου Συνεδριών</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionFolders.length === 0 ? (
              <div className="text-center py-6">
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν φάκελοι</h3>
                <p className="text-gray-600 mb-4">Δημιουργήστε τον πρώτο φάκελο συνεδριών για αυτό το παιδί</p>
                <Button
                  onClick={() => setShowCreateFolder(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Δημιουργία Φακέλου</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Επιλέξτε Φάκελο Συνεδριών *
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Επιλέξτε φάκελο --</option>
                    {sessionFolders.map((folder) => (
                      <option key={folder.$id} value={folder.$id}>
                        {folder.name} ({folder.totalSessions} συνεδρίες)
                        {folder.isActive ? ' - Ενεργό' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setShowCreateFolder(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Νέος Φάκελος</span>
                  </Button>
                  
                  {selectedFolderId && (
                    <div className="text-sm text-gray-600">
                      Επόμενη συνεδρία: #{getNextSessionNumber()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Folder Form */}
            {showCreateFolder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="border-t border-gray-200 pt-4 mt-4"
              >
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Δημιουργία Νέου Φακέλου</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Όνομα Φακέλου *
                    </label>
                    <Input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="π.χ. Πρόγραμμα 2024, Προχωρημένη Θεραπεία"
                      className="w-full"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Δημιουργία</span>
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }}
                      variant="outline"
                    >
                      Ακύρωση
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Session Setup Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <span>Ρύθμιση Συνεδριών</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Weeks and Sessions Per Week */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Συνολικές Εβδομάδες *
                </label>
                <select
                  value={sessionSetup.totalWeeks}
                  onChange={handleWeeksChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'εβδομάδα' : 'εβδομάδες'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Συνολικό πρόγραμμα: {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} συνεδρίες
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Συνεδρίες ανά Εβδομάδα *
                </label>
                <select
                  value={sessionSetup.sessionsPerWeek}
                  onChange={handleSessionsPerWeekChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'φορά' : 'φορές'} την εβδομάδα
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Templates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Πρόγραμμα Συνεδριών
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                  {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} / εβδομάδα
                </Badge>
              </div>

              <div className="space-y-4">
                {sessionSetup.sessionTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Συνεδρία {index + 1}
                      </h4>
                      <Clock className="w-5 h-5 text-purple-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Day of Week */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ημέρα
                        </label>
                        <select
                          value={template.dayOfWeek}
                          onChange={(e) => handleTemplateChange(index, 'dayOfWeek', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Time */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ώρα
                        </label>
                        <Input
                          type="time"
                          value={template.time}
                          onChange={(e) => handleTemplateChange(index, 'time', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Διάρκεια (λεπτά)
                        </label>
                        <select
                          value={template.duration}
                          onChange={(e) => handleTemplateChange(index, 'duration', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {DURATION_OPTIONS.map((duration) => (
                            <option key={duration} value={duration}>
                              {duration} λεπτά
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Σύνοψη Προγράμματος</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• {sessionSetup.totalWeeks} εβδομάδες προγράμματος</p>
                <p>• {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} ανά εβδομάδα</p>
                <p>• Συνολικά {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} συνεδρίες</p>
                <p>• Διάρκεια κάθε συνεδρίας: {sessionSetup.sessionTemplates[0]?.duration || 45} λεπτά</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button
                onClick={handleCreateSessions}
                disabled={saving || !selectedFolderId}
                className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {saving 
                    ? "Δημιουργία συνεδριών..." 
                    : !selectedFolderId 
                      ? "Επιλέξτε φάκελο για δημιουργία συνεδριών"
                      : `Δημιουργία ${sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} Συνεδριών`
                  }
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-1 gap-8">

          {/* Existing Sessions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Υπάρχουσες Συνεδρίες</span>
                  <Badge variant="secondary">{existingSessions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {existingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Δεν υπάρχουν συνεδρίες ακόμη</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Αυτή θα είναι η πρώτη συνεδρία!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {existingSessions.map((session, index) => (
                      <div
                        key={session.$id}
                        className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              #{session.sessionNumber}
                            </span>
                            <Badge className={getStatusColor(session.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(session.status)}
                                <span className="text-xs">
                                  {getStatusText(session.status)}
                                </span>
                              </div>
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(session.date).toLocaleDateString('el-GR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{session.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{session.duration}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Numbers Preview */}
            {student && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 mb-1">
                      #{getNextSessionNumber()} - #{getNextSessionNumber() + (sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek) - 1}
                    </div>
                    <p className="text-sm text-gray-600">
                      Αριθμοί συνεδριών που θα δημιουργηθούν
                    </p>
                    <div className="mt-2 text-xs text-purple-600">
                      {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} συνεδρίες συνολικά
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreateSessionContent />
    </Suspense>
  );
}
