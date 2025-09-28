"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig } from "@/lib/appwrite.client";
import { ArrowLeft, Target, Save, User, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  $id: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  parentId: string;
  therapyGoals?: string;
  idNumber?: string;
  status: string;
}

export default function TherapyGoalsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [therapyGoals, setTherapyGoals] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Fetch student data
  useEffect(() => {
    if (isAuthenticated && isAdmin && studentId) {
      fetchStudentData();
    }
  }, [isAuthenticated, isAdmin, studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError("");

      const studentDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        studentId
      );

      const studentData = studentDoc as unknown as Student;
      setStudent(studentData);
      setTherapyGoals(studentData.therapyGoals || "");
      
    } catch (error) {
      console.error("Error fetching student:", error);
      setError("Αποτυχία φόρτωσης στοιχείων μαθητή");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        studentId,
        {
          therapyGoals: therapyGoals.trim()
        }
      );

      setSuccess("Οι θεραπευτικοί στόχοι αποθηκεύτηκαν επιτυχώς!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (error) {
      console.error("Error saving therapy goals:", error);
      setError("Αποτυχία αποθήκευσης θεραπευτικών στόχων");
    } finally {
      setSaving(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Πίσω στο Admin</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Θεραπευτικοί Στόχοι
              </h1>
              {student && (
                <p className="text-gray-600">
                  Μαθητής: <strong>{student.name}</strong>
                </p>
              )}
            </div>
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

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* Student Info Card */}
        {student && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Στοιχεία Μαθητή
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Όνομα</label>
                  <p className="font-medium text-gray-900">{student.name}</p>
                </div>
                {student.age && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ηλικία</label>
                    <p className="font-medium text-gray-900">{student.age} έτη</p>
                  </div>
                )}
                {student.idNumber && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Αρ. Ταυτότητας</label>
                    <p className="font-medium text-gray-900">{student.idNumber}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Κατάσταση</label>
                  <p className="font-medium text-gray-900 capitalize">
                    {student.status === 'active' ? 'Ενεργός' : 'Ανενεργός'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Therapy Goals Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Επεξεργασία Θεραπευτικών Στόχων
            </CardTitle>
            <p className="text-sm text-gray-600">
              Προσθέστε ή επεξεργαστείτε τους θεραπευτικούς στόχους για αυτόν τον μαθητή. Οι στόχοι θα είναι ορατοί στους γονείς μέσω του dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="therapyGoals" className="block text-sm font-medium text-gray-700 mb-2">
                  Θεραπευτικοί Στόχοι
                </label>
                <Textarea
                  id="therapyGoals"
                  value={therapyGoals}
                  onChange={(e) => setTherapyGoals(e.target.value)}
                  placeholder="Περιγράψτε τους συγκεκριμένους θεραπευτικούς στόχους για αυτόν τον μαθητή...

Παραδείγματα:
• Βελτίωση της άρθρωσης των συμφώνων /κ/, /γ/, /χ/
• Ανάπτυξη λεξιλογίου σε θέματα οικογένειας και σχολείου  
• Κατανόηση και χρήση απλών προτάσεων
• Βελτίωση της φωνολογικής επεξεργασίας"
                  className="min-h-48 text-base"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Χρησιμοποιήστε σαφείς και μετρήσιμους στόχους που μπορούν να παρακολουθηθούν κατά τη διάρκεια της θεραπείας.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Αποθήκευση...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Αποθήκευση Στόχων</span>
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Επιστροφή</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Πληροφορίες</h3>
                <p className="text-sm text-blue-700">
                  Οι θεραπευτικοί στόχοι που ορίζετε εδώ θα εμφανίζονται στην κάρτα προφίλ του μαθητή στο dashboard των γονέων. 
                  Αυτό βοηθά τους γονείς να κατανοήσουν τους στόχους της θεραπείας και να παρακολουθήσουν την πρόοδο.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
