"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  Users, 
  ArrowLeft,
  Folder,
  FolderPlus,
  FolderOpen,
  Plus,
  Calendar,
  Eye,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Greek language constants
const GREEK_TEXT = {
  // Header
  sessionFolders: "Φάκελοι Συνεδριών",
  sessionFoldersFor: "Φάκελοι Συνεδριών για",
  manageFoldersDescription: "Διαχείριση φακέλων συνεδριών για οργανωμένες θεραπευτικές περιόδους",
  
  // Navigation
  back: "Πίσω",
  dashboard: "Αρχική",
  adminPanel: "Πίνακας Διαχείρισης",
  
  // Folder Management
  newFolder: "Νέος Φάκελος",
  folderName: "Όνομα Φακέλου",
  folderDescription: "Περιγραφή Φακέλου",
  totalWeeks: "Συνολικές Εβδομάδες",
  sessionsPerWeek: "Συνεδρίες ανά Εβδομάδα",
  sessionTime: "Ώρα Συνεδρίας",
  sessionDuration: "Διάρκεια (λεπτά)",
  dayOfWeek: "Ημέρα της Εβδομάδας",
  
  // Days
  monday: "Δευτέρα",
  tuesday: "Τρίτη", 
  wednesday: "Τετάρτη",
  thursday: "Πέμπτη",
  friday: "Παρασκευή",
  saturday: "Σάββατο",
  sunday: "Κυριακή",
  
  // Actions
  createFolder: "Δημιουργία Φακέλου",
  cancel: "Ακύρωση",
  view: "Προβολή",
  edit: "Επεξεργασία",
  delete: "Διαγραφή",
  addSession: "Προσθήκη Συνεδρίας",
  setActive: "Ενεργοποίηση",
  
  // Status
  active: "Ενεργός",
  completed: "Ολοκληρωμένος",
  paused: "Σε Παύση",
  currentlyActive: "Τρέχων Φάκελος",
  session: "Συνεδρία",
  sessionSchedule: "Πρόγραμμα Συνεδριών",
  summary: "Περίληψη",
  minutes: "λεπτά",
  
  // Messages
  loading: "Φόρτωση...",
  creating: "Δημιουργία...",
  success: "Επιτυχία!",
  error: "Σφάλμα!",
  noFolders: "Δεν υπάρχουν φάκελοι συνεδριών",
  noFoldersDescription: "Δημιουργήστε έναν νέο φάκελο για να ξεκινήσετε την οργάνωση των συνεδριών",
  
  // Folder Info
  sessionsCount: "συνεδρίες",
  completedSessions: "ολοκληρωμένες",
  startDate: "Ημ. Έναρξης",
  
  // Form Validation
  folderNameRequired: "Το όνομα φακέλου είναι υποχρεωτικό",
  invalidWeeks: "Ο αριθμός εβδομάδων πρέπει να είναι μεταξύ 1-52",
  invalidSessions: "Ο αριθμός συνεδριών ανά εβδομάδα πρέπει να είναι μεταξύ 1-7",
  
  // Error Messages
  studentNotFound: "Ο μαθητής δεν βρέθηκε",
  failedToLoadStudent: "Αποτυχία φόρτωσης στοιχείων μαθητή",
  failedToLoadFolders: "Αποτυχία φόρτωσης φακέλων",
  failedToCreateFolder: "Αποτυχία δημιουργίας φακέλου",
  
  // Confirmation
  confirmDeleteFolder: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον φάκελο; Θα διαγραφούν όλες οι συνεδρίες του."
};

interface Student {
  $id: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  parentId: string;
  status: string;
}

interface SessionFolder {
  $id: string;
  studentId: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

interface SessionTemplate {
  dayOfWeek: string;
  time: string;
  duration: number;
}

interface SessionSetupData {
  totalWeeks: number;
  sessionsPerWeek: number;
  sessionTemplates: SessionTemplate[];
}

export default function StudentFoldersPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  
  const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [folders, setFolders] = useState<SessionFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [settingActive, setSettingActive] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderDescription, setEditFolderDescription] = useState("");
  const [updatingFolder, setUpdatingFolder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // 🚀 ENHANCED UI/UX: Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // 🚀 ENHANCED UI/UX: Auto-dismiss error messages after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Create folder form state
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  
  // Session setup state
  const [sessionSetup, setSessionSetup] = useState<SessionSetupData>({
    totalWeeks: 4,
    sessionsPerWeek: 1,
    sessionTemplates: [{
      dayOfWeek: 'monday',
      time: '10:00',
      duration: 60
    }]
  });

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Load student data
  const loadStudent = async () => {
    if (!studentId) return;
    
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.students!,
        studentId
      );
      setStudent(response as unknown as Student);
    } catch (error) {
      console.error("Error loading student:", error);
      setError(GREEK_TEXT.failedToLoadStudent);
    }
  };

  // Load folders for student
  const loadFolders = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/session-folders?studentId=${studentId}`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders || []);
      } else {
        setError(data.error || GREEK_TEXT.failedToLoadFolders);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      setError(GREEK_TEXT.failedToLoadFolders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId && isAuthenticated && isAdmin) {
      loadStudent();
      loadFolders();
    }
  }, [studentId, isAuthenticated, isAdmin]);

  // Session setup handlers
  const handleWeeksChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weeks = parseInt(e.target.value) || 4;
    setSessionSetup(prev => ({ 
      ...prev, 
      totalWeeks: weeks 
    }));
  };

  const handleSessionsPerWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  };

  const handleTemplateChange = (index: number, field: keyof SessionTemplate, value: string | number) => {
    setSessionSetup(prev => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    }));
  };

  // Create folder handler
  const handleCreateFolder = async () => {
    if (!studentId || !newFolderName.trim()) {
      setError(GREEK_TEXT.folderNameRequired);
      return;
    }

    if (sessionSetup.totalWeeks < 1 || sessionSetup.totalWeeks > 52) {
      setError(GREEK_TEXT.invalidWeeks);
      return;
    }

    if (sessionSetup.sessionsPerWeek < 1 || sessionSetup.sessionsPerWeek > 7) {
      setError(GREEK_TEXT.invalidSessions);
      return;
    }

    // Prevent multiple simultaneous calls
    if (creating) {
      console.log('⚠️ Already creating folder, ignoring duplicate call');
      return;
    }

    setCreating(true);
    setError("");

    try {
      // 🚀 OPTIMIZED: Use bulk creation API instead of slow sequential creation
      console.log(`🚀 Creating folder "${newFolderName}" with ${sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} sessions using BULK API`);
      
      const startTime = Date.now();
      
      const response = await fetch('/api/admin/bulk-folder-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          folderName: newFolderName.trim(),
          folderDescription: newFolderDescription.trim() || `${sessionSetup.totalWeeks} weeks therapy program`,
          sessionSetup,
          setActive: folders.length === 0 // Set as active if it's the first folder
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || GREEK_TEXT.failedToCreateFolder);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`🎉 BULK CREATION SUCCESS! Created folder + ${result.data.sessions.length} sessions in ${totalTime}ms`);
      console.log(`⚡ Performance improvement: ${result.meta.performance.improvement}`);
      
      // Success message with performance stats
      setSuccess(`
        Φάκελος "${result.data.folder.name}" δημιουργήθηκε επιτυχώς με ${result.data.sessions.length} συνεδρίες! 
        ⚡ Χρόνος: ${totalTime < 1000 ? `${totalTime}ms` : `${(totalTime/1000).toFixed(1)}s`}
        (${result.meta.performance.improvement})
      `.trim());

      // Reset form and reload folders
      setNewFolderName("");
      setNewFolderDescription("");
      setShowCreateForm(false);
      await loadFolders();

    } catch (error) {
      console.error("Error creating folder:", error);
      setError((error as Error).message || GREEK_TEXT.failedToCreateFolder);
    } finally {
      setCreating(false);
    }
  };

  // Set folder as active
  const handleSetActive = async (folderId: string, folderName: string) => {
    setSettingActive(folderId);
    setError("");

    try {
      const response = await fetch(`/api/admin/session-folders/${folderId}/set-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Ο φάκελος "${folderName}" είναι τώρα ο ενεργός φάκελος!`);
        await loadFolders(); // Reload to get updated isActive states
      } else {
        setError(data.error || `Αποτυχία ενεργοποίησης φακέλου`);
      }
    } catch (error) {
      console.error("Error setting folder as active:", error);
      setError(`Σφάλμα κατά την ενεργοποίηση φακέλου`);
    } finally {
      setSettingActive(null);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(GREEK_TEXT.confirmDeleteFolder)) {
      return;
    }

    setDeletingFolder(folderId);
    setError("");

    try {
      const response = await fetch(`/api/admin/session-folders/${folderId}?cascade=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Ο φάκελος "${folderName}" διαγράφηκε επιτυχώς!`);
        await loadFolders(); // Reload to get updated folder list
      } else {
        setError(data.error || `Αποτυχία διαγραφής φακέλου`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      setError(`Σφάλμα κατά τη διαγραφή φακέλου`);
    } finally {
      setDeletingFolder(null);
    }
  };

  // Start editing folder
  const handleStartEditFolder = (folder: SessionFolder) => {
    setEditingFolder(folder.$id);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || "");
  };

  // Cancel editing folder
  const handleCancelEditFolder = () => {
    setEditingFolder(null);
    setEditFolderName("");
    setEditFolderDescription("");
  };

  // Update folder
  const handleUpdateFolder = async () => {
    if (!editFolderName.trim() || !editingFolder) {
      setError(GREEK_TEXT.folderNameRequired);
      return;
    }

    setUpdatingFolder(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/session-folders/${editingFolder}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFolderName.trim(),
          description: editFolderDescription.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Ο φάκελος "${editFolderName}" ενημερώθηκε επιτυχώς!`);
        await loadFolders(); // Reload to get updated folder list
        handleCancelEditFolder();
      } else {
        setError(data.error || `Αποτυχία ενημέρωσης φακέλου`);
      }
    } catch (error) {
      console.error("Error updating folder:", error);
      setError(`Σφάλμα κατά την ενημέρωση φακέλου`);
    } finally {
      setUpdatingFolder(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (folder: SessionFolder) => {
    switch (folder.status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {GREEK_TEXT.active}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {GREEK_TEXT.completed}
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {GREEK_TEXT.paused}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {folder.status}
          </Badge>
        );
    }
  };

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

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{GREEK_TEXT.studentNotFound}</h2>
          <Button onClick={() => router.back()} variant="outline">
            {GREEK_TEXT.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-Friendly Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            {/* Back button and title */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.back}</span>
              </Button>
              
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2 sm:gap-3">
                  <Folder className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                  <span className="leading-tight">
                    {GREEK_TEXT.sessionFoldersFor} {student.name}
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {GREEK_TEXT.manageFoldersDescription}
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
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.dashboard}</span>
              </Button>
              <Button
                onClick={() => router.push("/admin")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.adminPanel}</span>
              </Button>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none justify-center"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.newFolder}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Folder Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FolderPlus className="w-5 h-5 mr-2 text-blue-600" />
                    {GREEK_TEXT.newFolder}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Folder Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {GREEK_TEXT.folderName}
                      </label>
                      <Input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="π.χ. Χειμερινό Πρόγραμμα 2025"
                        className="h-12"
                      />
                    </div>

                    {/* Folder Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {GREEK_TEXT.folderDescription}
                      </label>
                      <Input
                        type="text"
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                        placeholder="Περιγραφή του προγράμματος (προαιρετικό)"
                        className="h-12"
                      />
                    </div>

                    {/* Session Template Configuration */}
                    <div className="space-y-6">
                      {/* Total Weeks and Sessions Per Week */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {GREEK_TEXT.totalWeeks} *
                          </label>
                          <select
                            value={sessionSetup.totalWeeks}
                            onChange={handleWeeksChange}
                            className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'εβδομάδα' : 'εβδομάδες'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Σύνολο συνεδριών: {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {GREEK_TEXT.sessionsPerWeek} *
                          </label>
                          <select
                            value={sessionSetup.sessionsPerWeek}
                            onChange={handleSessionsPerWeekChange}
                            className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          <h5 className="font-medium text-gray-900">Πρόγραμμα Συνεδριών</h5>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} / εβδομάδα
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          {sessionSetup.sessionTemplates.map((template, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="font-medium text-gray-900">Συνεδρία {index + 1}</h6>
                                <Clock className="w-4 h-4 text-purple-500" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Day of Week */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">{GREEK_TEXT.dayOfWeek}</label>
                                  <select
                                    value={template.dayOfWeek}
                                    onChange={(e) => handleTemplateChange(index, 'dayOfWeek', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="monday">{GREEK_TEXT.monday}</option>
                                    <option value="tuesday">{GREEK_TEXT.tuesday}</option>
                                    <option value="wednesday">{GREEK_TEXT.wednesday}</option>
                                    <option value="thursday">{GREEK_TEXT.thursday}</option>
                                    <option value="friday">{GREEK_TEXT.friday}</option>
                                    <option value="saturday">{GREEK_TEXT.saturday}</option>
                                    <option value="sunday">{GREEK_TEXT.sunday}</option>
                                  </select>
                                </div>

                                {/* Time */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">{GREEK_TEXT.sessionTime}</label>
                                  <Input
                                    type="time"
                                    value={template.time}
                                    onChange={(e) => handleTemplateChange(index, 'time', e.target.value)}
                                    className="w-full"
                                  />
                                </div>

                                {/* Duration */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">{GREEK_TEXT.sessionDuration}</label>
                                  <select
                                    value={template.duration}
                                    onChange={(e) => handleTemplateChange(index, 'duration', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value={30}>30 {GREEK_TEXT.minutes}</option>
                                    <option value={45}>45 {GREEK_TEXT.minutes}</option>
                                    <option value={60}>60 {GREEK_TEXT.minutes}</option>
                                    <option value={90}>90 {GREEK_TEXT.minutes}</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-medium text-blue-900 mb-2">Περίληψη</h6>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>• {sessionSetup.totalWeeks} εβδομάδες πρόγραμμα</p>
                          <p>• {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} την εβδομάδα</p>
                          <p>• Σύνολο {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} συνεδρίες</p>
                          <p>• Διάρκεια ανά συνεδρία: {sessionSetup.sessionTemplates[0]?.duration || 45} {GREEK_TEXT.minutes}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        onClick={handleCreateFolder}
                        disabled={creating}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 min-h-[48px] flex-1 sm:flex-none"
                      >
                        {creating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {GREEK_TEXT.creating}
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            {GREEK_TEXT.createFolder} με {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} Συνεδρίες
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => setShowCreateForm(false)}
                        variant="outline"
                        className="min-h-[48px] flex-1 sm:flex-none"
                      >
                        {GREEK_TEXT.cancel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : folders.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {GREEK_TEXT.noFolders}
              </h3>
              <p className="text-gray-600 mb-6">
                {GREEK_TEXT.noFoldersDescription}
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FolderPlus className="w-4 h-4" />
                {GREEK_TEXT.newFolder}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {folders.map((folder) => (
              <Card key={folder.$id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Folder Info or Edit Form */}
                    {editingFolder === folder.$id ? (
                      /* Edit Form */
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {GREEK_TEXT.folderName} *
                          </label>
                          <Input
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            placeholder="π.χ. Χειμερινό Πρόγραμμα 2024"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {GREEK_TEXT.folderDescription}
                          </label>
                          <Input
                            value={editFolderDescription}
                            onChange={(e) => setEditFolderDescription(e.target.value)}
                            placeholder="Προαιρετική περιγραφή φακέλου..."
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleUpdateFolder}
                            disabled={updatingFolder || !editFolderName.trim()}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {updatingFolder ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            ) : null}
                            Αποθήκευση
                          </Button>
                          <Button
                            onClick={handleCancelEditFolder}
                            size="sm"
                            variant="outline"
                          >
                            {GREEK_TEXT.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Folder Info */
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {folder.isActive ? (
                          <FolderOpen className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <Folder className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate flex items-center gap-2">
                              {folder.name}
                              {folder.isActive && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                  {GREEK_TEXT.currentlyActive}
                                </Badge>
                              )}
                            </h3>
                            {!folder.isActive && getStatusBadge(folder)}
                          </div>
                          
                          {folder.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {folder.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {folder.completedSessions}/{folder.totalSessions} {GREEK_TEXT.sessionsCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(folder.startDate).toLocaleDateString('el-GR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {editingFolder !== folder.$id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={() => router.push(`/admin/students/${studentId}/folders/${folder.$id}`)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 min-h-[40px] text-xs sm:text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{GREEK_TEXT.view}</span>
                        </Button>
                        
                        <Button
                          onClick={() => handleStartEditFolder(folder)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 min-h-[40px] text-xs sm:text-sm text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{GREEK_TEXT.edit}</span>
                        </Button>
                        
                        {!folder.isActive && (
                          <Button
                            onClick={() => handleSetActive(folder.$id, folder.name)}
                            disabled={settingActive === folder.$id}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 min-h-[40px] text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            {settingActive === folder.$id ? (
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span>{GREEK_TEXT.setActive}</span>
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => {
                            // Generate a timestamp-based session ID (like the existing sessions)
                            const newSessionId = Date.now().toString();
                            // Navigate directly to edit page for new session
                            router.push(`/admin/edit/${newSessionId}?studentId=${studentId}&folderId=${folder.$id}`);
                          }}
                          size="sm"
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 min-h-[40px] text-xs sm:text-sm"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{GREEK_TEXT.addSession}</span>
                        </Button>
                        
                        <Button
                          onClick={() => handleDeleteFolder(folder.$id, folder.name)}
                          disabled={deletingFolder === folder.$id}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 min-h-[40px] text-xs sm:text-sm text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                        >
                          {deletingFolder === folder.$id ? (
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span>{GREEK_TEXT.delete}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && folders.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{folders.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Φάκελοι</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {folders.filter(f => f.status === 'active').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.active}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {folders.reduce((acc, f) => acc + f.totalSessions, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.sessionsCount}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {folders.reduce((acc, f) => acc + f.completedSessions, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{GREEK_TEXT.completedSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
