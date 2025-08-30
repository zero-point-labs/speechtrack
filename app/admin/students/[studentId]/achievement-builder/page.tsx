"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminRoute, useAuth } from "@/lib/auth-middleware";
import { achievementService } from "@/lib/achievementService";
import { databases, Query } from '@/lib/appwrite.client';
import { appwriteConfig } from '@/lib/appwrite.config';
import { Plus, Trash2, Trophy, Edit, Save, Eye, RotateCcw } from "lucide-react";
import { StepBuilder } from "@/components/admin/StepBuilder";
// import { JourneyPreview } from "@/components/admin/JourneyPreview";

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  sessionIds: string[];
  requiredCompletionCount: number;
  hasTrophy: boolean;
  trophyData?: any;
  isCompleted: boolean;
  completedAt: string | null;
  unlockedAt: string | null;
}

export default function AchievementBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const studentId = params.studentId as string;
  
  // Get userId from URL parameters for proper redirect
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const parentUserId = searchParams.get('userId');
  
  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [journey, setJourney] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  // Journey configuration state
  const [journeyName, setJourneyName] = useState("");
  const [journeyDescription, setJourneyDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load student, sessions, and existing journey
      const [studentData, sessionsData, journeyData] = await Promise.all([
        databases.getDocument(
          appwriteConfig.databaseId!, 
          appwriteConfig.collections.students!, 
          studentId
        ),
        databases.listDocuments(
          appwriteConfig.databaseId!, 
          appwriteConfig.collections.sessions!, 
          [
            Query.equal('studentId', studentId),
            Query.orderDesc('$createdAt')
          ]
        ),
        achievementService.getJourneyForStudent(studentId)
      ]);

      setStudent(studentData);
      setSessions(sessionsData.documents);
      
      if (journeyData) {
        setJourney(journeyData);
        setJourneyName(journeyData.journeyName);
        setJourneyDescription(journeyData.description);
        setSteps(journeyData.stepConfiguration);
        setIsEditing(true);
      } else {
        // Initialize with default first step
        setSteps([createDefaultStep(1)]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultStep = (stepNumber: number): Step => ({
    stepNumber,
    title: `Βήμα ${stepNumber}`,
    description: "",
    icon: "🎯",
    color: "#3B82F6",
    sessionIds: [],
    requiredCompletionCount: 1,
    hasTrophy: false,
    isCompleted: false,
    completedAt: null,
    unlockedAt: stepNumber === 1 ? new Date().toISOString() : null
  });

  const addStep = () => {
    const newStep = createDefaultStep(steps.length + 1);
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepNumber: number) => {
    setSteps(steps.filter(step => step.stepNumber !== stepNumber)
      .map((step, index) => ({ ...step, stepNumber: index + 1 })));
  };

  const updateStep = (stepNumber: number, updates: Partial<Step>) => {
    setSteps(steps.map(step => 
      step.stepNumber === stepNumber ? { ...step, ...updates } : step
    ));
  };

  const saveJourney = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!journeyName.trim()) {
        alert('Παρακαλώ εισάγετε όνομα ταξιδιού');
        return;
      }
      
      if (steps.length === 0) {
        alert('Παρακαλώ προσθέστε τουλάχιστον ένα βήμα');
        return;
      }

      // Check if all steps have sessions assigned
      const stepsWithoutSessions = steps.filter(step => !step.sessionIds || step.sessionIds.length === 0);
      if (stepsWithoutSessions.length > 0) {
        const stepNumbers = stepsWithoutSessions.map(s => s.stepNumber).join(', ');
        if (!confirm(`Προειδοποίηση: Τα βήματα ${stepNumbers} δεν έχουν ανατεθεί συνεδρίες.\n\nΧωρίς συνεδρίες, αυτά τα βήματα δεν θα μπορούν να ολοκληρωθούν.\n\nΘέλετε να συνεχίσετε;`)) {
          return;
        }
      }
      
      console.log('Saving journey with data:', {
        journeyName,
        description: journeyDescription,
        totalSteps: steps.length,
        stepConfiguration: steps,
        user: user,
        studentId
      });
      
      const journeyData = {
        journeyName,
        description: journeyDescription,
        totalSteps: steps.length,
        stepConfiguration: steps
      };

      if (journey && journey.$id) {
        // Update existing journey
        console.log('Updating existing journey:', journey.$id);
        await achievementService.updateJourney(journey.$id, journeyData);
      } else {
        // Create new journey - use authenticated user ID
        const createdBy = (user as any)?.$id || 'admin';
        console.log('Creating new journey with createdBy:', createdBy);
        await achievementService.createJourney(studentId, journeyData, createdBy);
      }

      // Show success message
      alert('Το ταξίδι επιτευγμάτων αποθηκεύτηκε με επιτυχία!');
      
      // Redirect back to user detail page if we have the userId, otherwise fallback to student page
      if (parentUserId) {
        router.push(`/admin/users/${parentUserId}`);
      } else {
        router.push(`/admin/edit-student/${studentId}`);
      }
    } catch (error: any) {
      console.error('Error saving journey:', error);
      alert(`Σφάλμα κατά την αποθήκευση: ${error.message || 'Παρακαλώ δοκιμάστε ξανά.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetJourney = async () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να επαναφέρετε εντελώς το ταξίδι επιτευγμάτων;\n\nΑυτή η ενέργεια θα διαγράψει το υπάρχον ταξίδι και θα επιστρέψει στην αρχική κατάσταση.')) {
      return;
    }

    try {
      setResetting(true);
      
      await achievementService.resetStudentJourney(studentId);
      
      // Reset local state
      setJourney(null);
      setJourneyName("");
      setJourneyDescription("");
      setSteps([]);
      setIsEditing(false);
      setPreviewMode(false);
      
      alert('Το ταξίδι επιτευγμάτων επαναφέρθηκε με επιτυχία!');
      
      // Optionally redirect back
      if (parentUserId) {
        router.push(`/admin/users/${parentUserId}`);
      }
      
    } catch (error: any) {
      console.error('Error resetting journey:', error);
      alert(`Σφάλμα κατά την επαναφορά: ${error.message || 'Παρακαλώ δοκιμάστε ξανά.'}`);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <div className="h-96 bg-gray-300 rounded"></div>
                </div>
                <div className="lg:col-span-3">
                  <div className="h-96 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminRoute>
    );
  }

  if (previewMode) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
                      <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Προεπισκόπηση Ταξιδιού</h1>
            <Button
              variant="outline"
              onClick={() => setPreviewMode(false)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Πίσω στην Επεξεργασία
            </Button>
          </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Προεπισκόπηση Ταξιδιού</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{journeyName || 'Χωρίς τίτλο'}</h3>
                    <p className="text-gray-600">{journeyDescription || 'Χωρίς περιγραφή'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Σύνολο βημάτων: {steps.length}
                    </p>
                    <div className="space-y-2 mt-2">
                      {steps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span>{step.title || `Βήμα ${index + 1}`}</span>
                          {step.hasTrophy && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Δημιουργία Ταξιδιού Επιτευγμάτων</h1>
              <p className="text-gray-600">
                {isEditing ? 'Επεξεργασία' : 'Δημιουργία'} προσαρμοσμένου ταξιδιού επιτευγμάτων για {student?.name}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Προεπισκόπηση
              </Button>
              
              {journey && (
                <Button
                  variant="outline"
                  onClick={handleResetJourney}
                  disabled={resetting}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {resetting ? 'Επαναφορά...' : 'Επαναφορά Ταξιδιού'}
                </Button>
              )}
              
              <Button
                onClick={saveJourney}
                disabled={saving || !journeyName.trim() || steps.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση Ταξιδιού'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Journey Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Ρυθμίσεις Ταξιδιού</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Όνομα Ταξιδιού
                    </label>
                    <Input
                      value={journeyName}
                      onChange={(e) => setJourneyName(e.target.value)}
                      placeholder="π.χ., Το Ταξίδι Λόγου της Έμμας"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Περιγραφή
                    </label>
                    <Textarea
                      value={journeyDescription}
                      onChange={(e) => setJourneyDescription(e.target.value)}
                      placeholder="Σύντομη περιγραφή των στόχων του ταξιδιού"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Σύνολο Βημάτων: {steps.length}
                    </label>
                    <Button
                      onClick={addStep}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Προσθήκη Βήματος
                    </Button>
                  </div>

                  {/* Session Assignment Summary */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ανάθεση Συνεδριών
                    </label>
                    <div className="text-sm text-gray-600">
                      <div>Σύνολο Συνεδριών: {sessions.length}</div>
                      <div>Ανατεθείσες: {new Set(steps.flatMap(s => s.sessionIds)).size}</div>
                      <div>Μη Ανατεθείσες: {sessions.length - new Set(steps.flatMap(s => s.sessionIds)).size}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steps Builder */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {steps.map((step) => (
                  <StepBuilder
                    key={step.stepNumber}
                    step={step}
                    availableSessions={sessions}
                    onUpdate={(updates) => updateStep(step.stepNumber, updates)}
                    onDelete={() => removeStep(step.stepNumber)}
                    canDelete={steps.length > 1}
                  />
                ))}
                
                {steps.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Δεν Υπάρχουν Βήματα
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Δημιουργήστε το πρώτο βήμα επιτεύγματος για να ξεκινήσετε.
                      </p>
                      <Button onClick={addStep}>
                        <Plus className="w-4 h-4 mr-2" />
                        Δημιουργία Πρώτου Βήματος
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
