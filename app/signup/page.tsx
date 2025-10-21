"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, AUTH_EVENTS } from "@/lib/auth";
import { Eye, EyeOff, User, Mail, Lock, Key, MessageCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Signup page: Checking authentication...');
      try {
        const isAuth = await auth.isAuthenticated();
        console.log('🔍 Authentication status:', isAuth);
        
        if (isAuth) {
          const session = await auth.getSession();
          console.log('🔍 User session:', session);
          
          if (session?.isAdmin) {
            console.log('🔀 Redirecting admin to /admin');
            router.push("/admin");
          } else {
            console.log('🔀 Redirecting parent to /dashboard');
            router.push("/dashboard");
          }
        } else {
          console.log('✅ User not authenticated - showing signup form');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
      }
    };
    checkAuth();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Παρακαλώ εισάγετε το πλήρες όνομά σας");
      return;
    }

    if (!formData.email.trim()) {
      setError("Παρακαλώ εισάγετε τη διεύθυνση email σας");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Παρακαλώ εισάγετε τον αριθμό τηλεφώνου σας");
      return;
    }

    // Basic phone validation (Greek and Cypriot phone numbers)
    const phoneRegex = /^(69\d{8}|21\d{8}|22\d{8}|23\d{8}|24\d{8}|25\d{8}|26\d{8}|27\d{8}|28\d{8}|9[5-79]\d{6}|357\d{8})$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
      setError("Παρακαλώ εισάγετε έναν έγκυρο ελληνικό ή κυπριακό αριθμό τηλεφώνου");
      return;
    }

    if (formData.password.length < 6) {
      setError("Ο κωδικός πρόσβασης πρέπει να είναι τουλάχιστον 6 χαρακτήρες");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Οι κωδικοί πρόσβασης δεν ταιριάζουν");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await auth.register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone
      );
      
      if (result.success) {
        // Dispatch login event and redirect based on user role
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGIN));
        
        // If user is admin, redirect to admin panel, otherwise to onboarding
        if (result.user.isAdmin) {
          router.push("/admin");
        } else {
          router.push("/onboarding");
        }
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-4"
          >
            <img 
              src="/logo_transparent_bg.png" 
              alt="Marilena Nestoros Logo" 
              className="w-full h-full object-contain"
            />
          </motion.div>
          <p className="text-xl font-semibold text-gray-800 leading-tight">Κέντρο Ειδικών Θεραπειών<br />Μαριλένα Νέστωρος</p>
          <p className="text-sm text-gray-600">Λογοπαθολόγος/Λογοθεραπεύτρια</p>
        </div>



        {/* Signup Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl">
              <User className="w-5 h-5 text-blue-600" />
              <span>Δημιουργία Λογαριασμού</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Συμπληρώστε τα στοιχεία σας για να δημιουργήσετε τον λογαριασμό σας
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Πλήρες Όνομα
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Εισάγετε το πλήρες όνομά σας"
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Διεύθυνση Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Εισάγετε τη διεύθυνση email σας"
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Αριθμός Τηλεφώνου
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="π.χ. 6912345678 ή 97123456"
                      className="h-12 text-base"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                      Εισάγετε έναν έγκυρο ελληνικό ή κυπριακό αριθμό (κινητό ή σταθερό)
                    </p>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Κωδικός Πρόσβασης
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Δημιουργήστε κωδικό (τουλάχιστον 6 χαρακτήρες)"
                        className="pr-10 h-12 text-base"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Επιβεβαίωση Κωδικού
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Επιβεβαιώστε τον κωδικό σας"
                        className="pr-10 h-12 text-base"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-medium text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Δημιουργία Λογαριασμού...</span>
                      </div>
                    ) : (
                      "Δημιουργία Λογαριασμού"
                    )}
                  </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Έχετε ήδη λογαριασμό;{" "}
                <button 
                  onClick={() => router.push("/login")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Σύνδεση
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
