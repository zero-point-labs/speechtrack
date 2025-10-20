"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, AUTH_EVENTS } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Login page: Checking authentication...');
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
          console.log('✅ User not authenticated - showing login form');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email.trim()) {
      setError("Παρακαλώ εισάγετε τη διεύθυνση email σας");
      return;
    }

    if (!formData.password.trim()) {
      setError("Παρακαλώ εισάγετε τον κωδικό σας");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await auth.login(formData.email, formData.password);
      
      if (result.success) {
        // Dispatch login event
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGIN));
        
        // Redirect based on user role
        if (result.user.isAdmin) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(result.error || "Η σύνδεση απέτυχε");
      }
    } catch (error) {
      setError("Παρουσιάστηκε απροσδόκητο σφάλμα");
      console.error("Login error:", error);
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
          <p className="text-2xl font-semibold text-gray-800">Μαριλένα Νέστορος</p>
          <p className="text-base text-gray-600">Λογοθεραπευτής & Ειδικός Γλώσσας</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Σύνδεση</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Πρόσβαση στην πρόοδο της λογοθεραπείας του παιδιού σας
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Διεύθυνση Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Εισάγετε τη διεύθυνση email σας"
                    className="pl-10 h-12 text-base"
                    disabled={loading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
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
                    placeholder="Εισάγετε τον κωδικό σας"
                    className="pl-10 pr-10 h-12 text-base"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                    <span>Σύνδεση...</span>
                  </div>
                ) : (
                  "Σύνδεση"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Δεν έχετε λογαριασμό;{" "}
                  <button 
                    onClick={() => router.push("/signup")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Εγγραφή
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Είστε λογοθεραπευτής;{" "}
                  <button 
                    onClick={() => router.push("/admin/login")}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Σύνδεση Διαχειριστή
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>Χρειάζεστε βοήθεια;</strong><br />
                Επικοινωνήστε με τον λογοθεραπευτή σας αν αντιμετωπίζετε προβλήματα πρόσβασης στον λογαριασμό σας.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
