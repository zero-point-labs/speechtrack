"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminRoute } from "@/lib/auth-middleware";
import { databases, appwriteConfig } from "@/lib/appwrite.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save,
  User,
  Phone,
  Calendar
} from "lucide-react";

// Interface for Student (matching Appwrite structure)
interface Student {
  $id: string;
  name: string;
  age: number;
  dateOfBirth?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'completed';
  parentContact: string | {
    name: string;
    phone: string;
    email: string;
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

// Helper function to parse parent contact
const parseParentContact = (parentContactString: string | object) => {
  if (typeof parentContactString === 'object') {
    return parentContactString;
  }
  
  try {
    return JSON.parse(parentContactString);
  } catch (error) {
    console.error('Error parsing parent contact:', error);
    return { name: '', phone: '', email: '' };
  }
};

function EditStudentPageContent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load student data from Appwrite
  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      
      // Load student from Appwrite
      const student = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        studentId
      );
      
      console.log('Loaded student data:', student);
      setStudentData(student as Student);
      
    } catch (error) {
      console.error('Error loading student data:', error);
      setStudentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleBackToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!studentData) return;
    
    setIsSaving(true);
    
    try {
      // Prepare data for Appwrite
      const updateData = {
        name: studentData.name,
        age: studentData.dateOfBirth ? calculateAge(studentData.dateOfBirth) : studentData.age,
        status: studentData.status,
        parentContact: typeof studentData.parentContact === 'string' 
          ? studentData.parentContact 
          : JSON.stringify(studentData.parentContact)
      };

      // Only add dateOfBirth if it exists (for backward compatibility)
      if (studentData.dateOfBirth) {
        updateData.dateOfBirth = studentData.dateOfBirth;
      }
      
      // Update student in Appwrite
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        studentId,
        updateData
      );
      
      console.log('✅ Successfully updated student:', studentData.name);
      router.push('/admin');
      
    } catch (error) {
      console.error('Error saving student data:', error);
      alert('Σφάλμα κατά την αποθήκευση των στοιχείων. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsSaving(false);
    }
  }, [studentData, router, studentId]);

  const handleStudentChange = useCallback((field: keyof Student, value: string | number | 'active' | 'inactive' | 'completed') => {
    if (!studentData) return;
    
    setStudentData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  }, [studentData]);

  const handleParentContactChange = useCallback((field: string, value: string) => {
    if (!studentData) return;
    
    const currentContact = parseParentContact(studentData.parentContact);
    
    setStudentData(prev => prev ? {
      ...prev,
      parentContact: {
        ...currentContact,
        [field]: value
      }
    } : null);
  }, [studentData]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση δεδομένων μαθητή...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Μαθητής δεν βρέθηκε</h1>
          <p className="text-gray-600 mb-6">Ο μαθητής που ζητήσατε δεν υπάρχει.</p>
          <Button onClick={handleBackToAdmin}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή στο Πάνελ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToAdmin}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Επεξεργασία Μαθητή</h1>
                <p className="text-sm text-gray-500">{studentData.name}</p>
              </div>
            </div>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Αποθήκευση...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Αποθήκευση
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 overflow-x-hidden">
        
        {/* Basic Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Βασικά Στοιχεία</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Όνομα Μαθητή *
                </label>
                <Input
                  value={studentData.name}
                  onChange={(e) => handleStudentChange('name', e.target.value)}
                  className="w-full"
                  placeholder="Εισάγετε το όνομα"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ημερομηνία Γέννησης *
                </label>
                <Input
                  type="date"
                  value={studentData.dateOfBirth || ''}
                  onChange={(e) => handleStudentChange('dateOfBirth', e.target.value)}
                  className="w-full"
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
                {studentData.dateOfBirth && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ηλικία: {calculateAge(studentData.dateOfBirth)} ετών
                  </p>
                )}
              </div>
              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Κατάσταση
                </label>
                <select
                  value={studentData.status}
                  onChange={(e) => handleStudentChange('status', e.target.value as 'active' | 'inactive' | 'completed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Ενεργός</option>
                  <option value="inactive">Ανενεργός</option>
                  <option value="completed">Ολοκληρώθηκε</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>





        {/* Parent Contact */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Phone className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Στοιχεία Γονέα/Κηδεμόνα</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Όνομα Γονέα *
                </label>
                <Input
                  value={parseParentContact(studentData.parentContact).name}
                  onChange={(e) => handleParentContactChange('name', e.target.value)}
                  className="w-full"
                  placeholder="Όνομα γονέα/κηδεμόνα"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Τηλέφωνο
                </label>
                <Input
                  value={parseParentContact(studentData.parentContact).phone}
                  onChange={(e) => handleParentContactChange('phone', e.target.value)}
                  className="w-full"
                  placeholder="+30 xxx xxx xxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={parseParentContact(studentData.parentContact).email}
                  onChange={(e) => handleParentContactChange('email', e.target.value)}
                  className="w-full"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Επιπλέον Πληροφορίες</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ημερομηνία Εγγραφής
                </label>
                <Input
                  type="date"
                  value={studentData.joinDate}
                  onChange={(e) => handleStudentChange('joinDate', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κατάσταση
                  </label>
                  <Badge className={`${
                    studentData.status === 'active' ? 'bg-green-100 text-green-800' :
                    studentData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {studentData.status === 'active' ? 'Ενεργός' :
                     studentData.status === 'inactive' ? 'Ανενεργός' : 'Ολοκληρώθηκε'}
                  </Badge>
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

export default function EditStudentPage() {
  return (
    <AdminRoute>
      <EditStudentPageContent />
    </AdminRoute>
  );
}
