"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-middleware";

export default function Home() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    router.push(isAdmin ? '/admin' : '/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SpeechTrack</h1>
          <p className="text-gray-600">Πλατφόρμα Λογοθεραπείας</p>
        </motion.div>

        {/* Sign Up / Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Καλώς ήρθατε
                </h2>
                <p className="text-gray-600 text-sm">
                  Συνδεθείτε ή εγγραφείτε για πρόσβαση στην πλατφόρμα
                </p>
              </div>

              <div className="space-y-4">
                {/* Sign Up Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => router.push('/signup')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-base font-medium shadow-lg"
                    size="lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Εγγραφή Νέου Χρήστη
                  </Button>
                </motion.div>

                {/* Login Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base font-medium"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Σύνδεση Υπάρχοντος Χρήστη
                  </Button>
                </motion.div>

                {/* Admin Access */}
                <div className="pt-4 border-t border-gray-200">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => router.push('/admin/login')}
                      variant="ghost"
                      className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 py-2 text-sm"
                    >
                      Πρόσβαση Διαχειριστή
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          className="text-center mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>Ασφαλής και εύκολη πρόσβαση στη λογοθεραπεία</p>
        </motion.div>
      </div>
    </div>
  );
}
