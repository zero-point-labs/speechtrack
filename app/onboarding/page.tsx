"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig } from "@/lib/appwrite.client";
import { Baby, Calendar, FileText, ArrowRight, ArrowLeft, CheckCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChildFormData {
  name: string;
  dateOfBirth: string;
  age: number;
  idNumber: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [childData, setChildData] = useState<ChildFormData>({
    name: "",
    dateOfBirth: "",
    age: 0,
    idNumber: ""
  });
  
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isAdmin) {
        router.push("/admin");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Calculate age when date of birth changes
  useEffect(() => {
    if (childData.dateOfBirth) {
      const birthDate = new Date(childData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setChildData(prev => ({ ...prev, age: age - 1 }));
      } else {
        setChildData(prev => ({ ...prev, age }));
      }
    }
  }, [childData.dateOfBirth]);

  const handleInputChange = (field: keyof ChildFormData, value: string | number) => {
    setChildData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validateStep1 = () => {
    if (!childData.name.trim()) {
      setError("Παρακαλώ εισάγετε το όνομα του παιδιού");
      return false;
    }
    if (!childData.dateOfBirth) {
      setError("Παρακαλώ εισάγετε την ημερομηνία γέννησης");
      return false;
    }
    if (childData.age < 2 || childData.age > 18) {
      setError("Η ηλικία πρέπει να είναι μεταξύ 2 και 18 ετών");
      return false;
    }
    return true;
  };


  const handleNext = () => {
    setError("");
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Δεν βρέθηκε χρήστης. Παρακαλώ συνδεθείτε ξανά.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create student record
      const studentData = {
        name: childData.name,
        dateOfBirth: childData.dateOfBirth,
        parentId: user.id,
        status: 'active',
        totalSessions: 0,
        completedSessions: 0,
        joinDate: new Date().toISOString(),
        ...(childData.idNumber && { idNumber: childData.idNumber })
      };

      const student = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.students,
        'unique()',
        studentData
      );

      // Messages functionality disabled - collection was removed
      // Goals and notes are stored in the student record instead

      // Redirect to dashboard
      router.push("/dashboard");

    } catch (error) {
      console.error("Onboarding error:", error);
      setError("Προέκυψε σφάλμα κατά τη δημιουργία του προφίλ. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
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

  // Don't render if not authenticated or if admin (will redirect)
  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Baby className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Καλώς ήρθατε στο SpeechTrack</h1>
          <p className="text-gray-600">Ας δημιουργήσουμε το προφίλ του παιδιού σας</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 2 && (
                  <div
                    className={`w-8 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl">
              {step === 1 && <User className="w-5 h-5 text-blue-600" />}
              {step === 2 && <CheckCircle className="w-5 h-5 text-blue-600" />}
              <span>
                {step === 1 && "Βασικά Στοιχεία"}
                {step === 2 && "Επιβεβαίωση"}
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {step === 1 && "Εισάγετε τα βασικά στοιχεία του παιδιού σας"}
              {step === 2 && "Επιβεβαιώστε τα στοιχεία και ολοκληρώστε"}
            </p>
          </CardHeader>
          
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="childName" className="text-sm font-medium text-gray-700">
                      Όνομα Παιδιού *
                    </label>
                    <Input
                      id="childName"
                      type="text"
                      value={childData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Εισάγετε το όνομα του παιδιού"
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                      Ημερομηνία Γέννησης *
                    </label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={childData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="idNumber" className="text-sm font-medium text-gray-700">
                      Αριθμός Ταυτότητας (προαιρετικό)
                    </label>
                    <Input
                      id="idNumber"
                      type="text"
                      value={childData.idNumber}
                      onChange={(e) => handleInputChange("idNumber", e.target.value)}
                      placeholder="π.χ. 123456789"
                      className="h-12 text-base"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                      Ο αριθμός ταυτότητας του παιδιού (προαιρετικό πεδίο)
                    </p>
                  </div>

                  {childData.age > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Ηλικία:</strong> {childData.age} {childData.age === 1 ? 'έτος' : 'έτη'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Confirmation */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-800 mb-4">Επιβεβαίωση Στοιχείων</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Όνομα:</span>
                        <span className="ml-2 text-gray-900">{childData.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ηλικία:</span>
                        <span className="ml-2 text-gray-900">{childData.age} έτη</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ημερομηνία Γέννησης:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(childData.dateOfBirth).toLocaleDateString('el-GR')}
                        </span>
                      </div>
                      {childData.idNumber && (
                        <div>
                          <span className="font-medium text-gray-700">Αριθμός Ταυτότητας:</span>
                          <span className="ml-2 text-gray-900">{childData.idNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Μετά την επιβεβαίωση, θα δημιουργηθεί το προφίλ του παιδιού σας και θα μπορείτε να προσπελάσετε το dashboard σας. Ο θεραπευτής θα προσθέσει τους θεραπευτικούς στόχους και θα προγραμματίσει τις συνεδρίες.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-6"
              >
                {error}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                onClick={step > 1 ? handleBack : () => router.push('/dashboard')}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{step > 1 ? 'Πίσω' : 'Παράβλεψη'}</span>
              </Button>

              {step < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                  disabled={loading}
                >
                  <span>Επόμενο</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Δημιουργία...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Ολοκλήρωση</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
