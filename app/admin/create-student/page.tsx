"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { databases, appwriteConfig } from "@/lib/appwrite.client";
import { AdminRoute } from "@/lib/auth-middleware";
import { 
  ArrowLeft, 
  Save, 
  User,
  Calendar,
  Clock,
  Copy,
  CheckCircle
} from "lucide-react";

// Session template interface
interface SessionTemplate {
  dayOfWeek: string;
  time: string;
  duration: number; // in minutes
}

// Form data interface
interface StudentFormData {
  name: string;
  dateOfBirth: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  sessionSetup: {
    totalWeeks: number;
    sessionsPerWeek: number;
    sessionTemplates: SessionTemplate[];
  };
}

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Success state interface
interface CreatedStudent {
  id: string;
  name: string;
  clientCode: string;
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

function CreateStudentForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    dateOfBirth: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    sessionSetup: {
      totalWeeks: 12,
      sessionsPerWeek: 1,
      sessionTemplates: [{
        dayOfWeek: 'monday',
        time: '10:00',
        duration: 45
      }]
    }
  });

  // Handle basic info changes
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleDateOfBirthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }));
  }, []);

  const handleParentNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, parentName: e.target.value }));
  }, []);

  const handleParentEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, parentEmail: e.target.value }));
  }, []);

  const handleParentPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, parentPhone: e.target.value }));
  }, []);

  // Handle session setup changes
  const handleWeeksChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const weeks = parseInt(e.target.value) || 12;
    setFormData(prev => ({ 
      ...prev, 
      sessionSetup: { ...prev.sessionSetup, totalWeeks: weeks }
    }));
  }, []);

  const handleSessionsPerWeekChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessions = parseInt(e.target.value);
    setFormData(prev => {
      const currentTemplates = prev.sessionSetup.sessionTemplates;
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
        sessionSetup: {
          ...prev.sessionSetup,
          sessionsPerWeek: sessions,
          sessionTemplates: newTemplates
        }
      };
    });
  }, []);

  // Handle individual session template changes
  const handleTemplateChange = useCallback((index: number, field: keyof SessionTemplate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sessionSetup: {
        ...prev.sessionSetup,
        sessionTemplates: prev.sessionSetup.sessionTemplates.map((template, i) => 
          i === index ? { ...template, [field]: value } : template
        )
      }
    }));
  }, []);

  // Generate client code
  const generateClientCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Handle form submission
  const handleSave = useCallback(async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Παρακαλώ εισάγετε το όνομα του μαθητή');
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Παρακαλώ εισάγετε την ημερομηνία γέννησης');
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    if (age < 2 || age > 18) {
      setError('Η ηλικία του μαθητή πρέπει να είναι μεταξύ 2 και 18 ετών');
      return;
    }

    if (!formData.parentName.trim()) {
      setError('Παρακαλώ εισάγετε το όνομα του γονέα');
      return;
    }

    if (!formData.parentEmail.trim()) {
      setError('Παρακαλώ εισάγετε το email του γονέα');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      // Generate client code
      const clientCode = generateClientCode();
      
      // Create student in Appwrite
      const student = await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.students!,
        'unique()',
        {
          name: formData.name.trim(),
          age: calculateAge(formData.dateOfBirth),
          dateOfBirth: formData.dateOfBirth,
          totalSessions: formData.sessionSetup.totalWeeks * formData.sessionSetup.sessionsPerWeek,
          completedSessions: 0,
          status: 'active',
          clientCode: clientCode,
          joinDate: new Date().toISOString(),
          parentContact: JSON.stringify({
            name: formData.parentName.trim(),
            email: formData.parentEmail.trim(),
            phone: formData.parentPhone.trim()
          })
        }
      );

      if (!student.$id) {
        throw new Error('Failed to create student - no ID returned');
      }

      // Create client code document
      await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.clientCodes!,
        'unique()',
        {
          code: clientCode,
          studentId: student.$id!,
          isUsed: false
        }
      );

      // Create initial sessions based on templates
      const sessions = [];
      const startDate = new Date();
      
      for (let week = 0; week < formData.sessionSetup.totalWeeks; week++) {
        for (let sessionIndex = 0; sessionIndex < formData.sessionSetup.sessionsPerWeek; sessionIndex++) {
          const template = formData.sessionSetup.sessionTemplates[sessionIndex];
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + (week * 7));
          
          sessions.push({
            studentId: student.$id!,
            sessionNumber: (week * formData.sessionSetup.sessionsPerWeek) + sessionIndex + 1,
            title: `Συνεδρία ${(week * formData.sessionSetup.sessionsPerWeek) + sessionIndex + 1}`,
            description: '',
            date: sessionDate.toISOString(),
            duration: template.duration.toString(),
            status: sessionIndex === 0 && week === 0 ? 'available' : 'locked',
            isPaid: false
          });
        }
      }

      // Create all sessions
      console.log(`Creating ${sessions.length} sessions for student ${student.name}...`);
      for (let i = 0; i < sessions.length; i++) {
        const sessionData = sessions[i];
        await databases.createDocument(
          appwriteConfig.databaseId!,
          appwriteConfig.collections.sessions!,
          'unique()',
          sessionData
        );
        
        // Log progress for large batches
        if (sessions.length > 10 && (i + 1) % 10 === 0) {
          console.log(`Created ${i + 1}/${sessions.length} sessions...`);
        }
      }
      console.log(`✅ Successfully created all ${sessions.length} sessions!`);

      // Success! Show the client code
      setCreatedStudent({
        id: student.$id!,
        name: student.name,
        clientCode: clientCode
      });
      
    } catch (error: unknown) {
      console.error('Error creating student:', error);
      setError(error instanceof Error ? error.message : 'Σφάλμα κατά τη δημιουργία του μαθητή');
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  const handleCancel = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleCopyCode = useCallback(() => {
    if (createdStudent) {
      navigator.clipboard.writeText(createdStudent.clientCode);
    }
  }, [createdStudent]);

  const handleCreateAnother = useCallback(() => {
    setCreatedStudent(null);
    setError('');
    setFormData({
      name: "",
      dateOfBirth: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      sessionSetup: {
        totalWeeks: 12,
        sessionsPerWeek: 1,
        sessionTemplates: [{
          dayOfWeek: 'monday',
          time: '10:00',
          duration: 45
        }]
      }
    });
  }, []);

  // Success view
  if (createdStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Επιτυχία!</h1>
              <p className="text-gray-600">Ο μαθητής δημιουργήθηκε επιτυχώς</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Στοιχεία Μαθητή</h3>
                <p className="text-blue-800"><strong>Όνομα:</strong> {createdStudent.name}</p>
                <p className="text-blue-800"><strong>ID:</strong> {createdStudent.id}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Client Code</h3>
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <span className="font-mono text-lg font-bold text-green-800">
                    {createdStudent.clientCode}
                  </span>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Δώστε αυτόν τον κωδικό στον γονέα για να δημιουργήσει λογαριασμό
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleCreateAnother}
                variant="outline"
                className="flex-1"
              >
                Νέος Μαθητής
              </Button>
              <Button
                onClick={() => router.push('/admin')}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Νέος Μαθητής</h1>
              <p className="text-sm text-gray-500">Δημιουργία νέου μαθητή</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim() || !formData.dateOfBirth || !formData.parentName.trim() || !formData.parentEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Αποθήκευση</span>
                <span className="sm:hidden">Αποθήκευση</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 overflow-x-hidden">
        
        {/* Basic Information Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-600" />
                Βασικά Στοιχεία
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Όνομα Μαθητή *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Εισάγετε το όνομα του μαθητή"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ημερομηνία Γέννησης *
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleDateOfBirthChange}
                    className="w-full"
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                  {formData.dateOfBirth && (
                    <p className="text-sm text-gray-600 mt-1">
                      Ηλικία: {calculateAge(formData.dateOfBirth)} ετών
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parent Contact Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-3 text-green-600" />
                Στοιχεία Γονέα
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Όνομα Γονέα *
                  </label>
                  <Input
                    value={formData.parentName}
                    onChange={handleParentNameChange}
                    placeholder="Εισάγετε το όνομα του γονέα"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Γονέα *
                  </label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={handleParentEmailChange}
                    placeholder="Εισάγετε το email του γονέα"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Τηλέφωνο Γονέα
                  </label>
                  <Input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={handleParentPhoneChange}
                    placeholder="Εισάγετε το τηλέφωνο του γονέα"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Setup Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-purple-600" />
                Ρύθμιση Συνεδριών
              </h2>

              {/* Total Weeks and Sessions Per Week */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Συνολικές Εβδομάδες *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.sessionSetup.totalWeeks}
                    onChange={handleWeeksChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Συνολικό πρόγραμμα: {formData.sessionSetup.totalWeeks * formData.sessionSetup.sessionsPerWeek} συνεδρίες
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Συνεδρίες ανά Εβδομάδα *
                  </label>
                  <select
                    value={formData.sessionSetup.sessionsPerWeek}
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
                    {formData.sessionSetup.sessionsPerWeek} {formData.sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} / εβδομάδα
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.sessionSetup.sessionTemplates.map((template, index) => (
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
                  <p>• {formData.sessionSetup.totalWeeks} εβδομάδες προγράμματος</p>
                  <p>• {formData.sessionSetup.sessionsPerWeek} {formData.sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} ανά εβδομάδα</p>
                  <p>• Συνολικά {formData.sessionSetup.totalWeeks * formData.sessionSetup.sessionsPerWeek} συνεδρίες</p>
                  <p>• Διάρκεια κάθε συνεδρίας: {formData.sessionSetup.sessionTemplates[0]?.duration || 45} λεπτά</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

export default function CreateStudentPage() {
  return (
    <AdminRoute>
      <CreateStudentForm />
    </AdminRoute>
  );
}
