"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

// Interface for Student
interface Student {
  id: string;
  name: string;
  age: number;
  photo: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'completed';
  sessionsCompleted: number;
  totalSessions: number;
  nextSession?: string;
  therapist: string;
  diagnosis: string[];
  parentContact: {
    name: string;
    phone: string;
    email: string;
  };
}

// Mock data for students (this would normally come from a database)
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Emma Παπαδόπουλου",
    age: 7,
    photo: "/api/placeholder/100/100",
    joinDate: "2024-01-15",
    status: "active",
    sessionsCompleted: 2,
    totalSessions: 12,
    nextSession: "2024-01-29",
    therapist: "Μαριλένα Νέστωρος", 
    diagnosis: ["Δυσαρθρία", "Καθυστέρηση Ομιλίας"],
    parentContact: {
      name: "Αννα Παπαδοπούλου",
      phone: "+30 697 123 4567",
      email: "anna.papa@email.com"
    }
  },
  {
    id: "2",
    name: "Νίκος Γεωργίου",
    age: 5,
    photo: "/api/placeholder/100/100",
    joinDate: "2024-01-20",
    status: "active",
    sessionsCompleted: 1,
    totalSessions: 8,
    nextSession: "2024-02-01",
    therapist: "Μαριλένα Νέστωρος",
    diagnosis: ["Τραυλισμός"],
    parentContact: {
      name: "Πέτρος Γεωργίου",
      phone: "+30 697 987 6543",
      email: "petros.geo@email.com"
    }
  }
];

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load student data
  useEffect(() => {
    if (studentId) {
      const student = mockStudents.find(s => s.id === studentId);
      if (student) {
        setStudentData(student);
      }
      setIsLoading(false);
    }
  }, [studentId]);

  // Event handlers
  const handleBackToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!studentData) return;
    
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Saving student data:', studentData);
    
    setIsSaving(false);
    router.push('/admin');
  }, [studentData, router]);

  const handleStudentChange = useCallback((field: keyof Student, value: string | number | 'active' | 'inactive' | 'completed') => {
    if (!studentData) return;
    
    setStudentData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  }, [studentData]);

  const handleParentContactChange = useCallback((field: keyof Student['parentContact'], value: string) => {
    if (!studentData) return;
    
    setStudentData(prev => prev ? {
      ...prev,
      parentContact: {
        ...prev.parentContact,
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
                  Ηλικία *
                </label>
                <Input
                  type="number"
                  value={studentData.age}
                  onChange={(e) => handleStudentChange('age', parseInt(e.target.value) || 0)}
                  className="w-full"
                  placeholder="Εισάγετε την ηλικία"
                />
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
                  value={studentData.parentContact.name}
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
                  value={studentData.parentContact.phone}
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
                  value={studentData.parentContact.email}
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
