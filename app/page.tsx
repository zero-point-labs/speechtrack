"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, BookOpen, ArrowRight, CheckCircle, Heart, Shield, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-middleware";

export default function Home() {
  const { user, isAuthenticated, isAdmin, isParent } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">SpeechTrack</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')}
                  variant="outline"
                >
                  {isAdmin ? 'Admin Panel' : 'Dashboard'}
                </Button>
              </motion.div>
            </div>
          ) : (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/login')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Σύνδεση
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => router.push('/signup')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Εγγραφή
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Μετατρέψτε τη Λογοθεραπεία σε ένα
            <span className="text-blue-600 block">Συνεργατικό Ταξίδι</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Γεφυρώστε το χάσμα μεταξύ λογοθεραπευτών και γονέων με την ολοκληρωμένη πλατφόρμα μας 
            που παρακολουθεί την πρόοδο, οργανώνει συνεδρίες και ενισχύει την επικοινωνία για καλύτερα αποτελέσματα θεραπείας.
          </p>
          
          {/* Dashboard Access Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {isAuthenticated ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                    onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')}
                  >
                    Μετάβαση στο {isAdmin ? 'Admin Panel' : 'Dashboard'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>

              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                    onClick={() => router.push('/signup')}
                  >
                    Ξεκινήστε Δωρεάν
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6 border-gray-300"
                    onClick={() => router.push('/login')}
                  >
                    Σύνδεση
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          {/* Quick Access Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50 px-6 py-3"
                onClick={() => router.push('/dashboard')}
              >
                <User className="mr-2 w-4 h-4" />
                Parent Dashboard
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3"
                onClick={() => router.push('/admin')}
              >
                <Shield className="mr-2 w-4 h-4" />
                Admin Panel
              </Button>
            </motion.div>

          </div>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Δεν απαιτείται πιστωτική κάρτα
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Εγκατάσταση σε 5 λεπτά
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              Αγαπημένο από οικογένειες
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Οπτικός Πίνακας Πορείας</h3>
              <p className="text-gray-600 leading-relaxed">
                Παρακολουθήστε την πρόοδο του παιδιού σας με την ευχρηστη χρονογραμμή μας που δείχνει ολοκληρωμένες συνεδρίες, 
                επερχόμενα ιστόρης και εργασίες σε μία απλή προβολή.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Απρόσκοπτη Επικοινωνία</h3>
              <p className="text-gray-600 leading-relaxed">
                Μείνετε σε επαφή με τον λογοθεραπευτή σας μέσω ειδικών συνεδρίων ανάδρασης 
                και άμεσης ανταλλαγής μηνυμάτων για οποιεσδήποτε ερωτήσεις ή ανησυχίες.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Εμπλοκή Γονέων</h3>
              <p className="text-gray-600 leading-relaxed">
                Αποκτήστε πρόσβαση σε σημειώσεις συνεδρίων, υλικά εργασιών και αναφορές προόδου για ενεργή συμμετοχή 
                στο λογοθεραπευτικό ταξίδι του παιδιού σας από το σπίτι.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ετοιμοι να Μετασχηματίσετε την Λογοθεραπευτική σας Εμπειρία;</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Συμμετέχετε σε οικογένειες και θεραπευτές που ήδη βλέπουν καλύτερα αποτελέσματα με το SpeechTrack.
          </p>
          
          {isAuthenticated ? (
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')}
            >
              Πρόσβαση στο {isAdmin ? 'Admin Panel' : 'Dashboard'} σας
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => router.push('/signup')}
              >
                Ξεκίνημα Δωρεάν Δοκιμής
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">SpeechTrack</span>
          </div>
          <p className="text-gray-600">
            Ενδυναμώνουμε οικογένειες και θεραπευτές να επιτύχουν καλύτερα λογοθεραπευτικά αποτελέσματα μαζί.
          </p>
        </div>
      </footer>
    </div>
  );
}
