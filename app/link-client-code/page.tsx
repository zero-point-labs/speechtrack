"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientCodes, AUTH_EVENTS } from "@/lib/auth";
import { useAuth } from "@/lib/auth-middleware";
import { Key, CheckCircle, User, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LinkClientCodePage() {
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeValidation, setCodeValidation] = useState({ valid: false, studentId: null });
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isAdmin) {
        // Admin users don't need client codes, redirect to admin panel
        router.push("/admin");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Validate client code when it changes
  useEffect(() => {
    const validateCode = async () => {
      if (clientCode.length >= 6) {
        try {
          const result = await clientCodes.validate(clientCode.toUpperCase());
          setCodeValidation(result);
          if (result.valid) {
            setError("");
          } else {
            setError("Invalid or already used client code");
          }
        } catch (error) {
          setCodeValidation({ valid: false, studentId: null });
          setError("Error validating client code");
        }
      } else {
        setCodeValidation({ valid: false, studentId: null });
        setError("");
      }
    };

    if (clientCode.trim()) {
      const timeoutId = setTimeout(validateCode, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [clientCode]);

  const handleLinkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientCode.trim()) {
      setError("Please enter your client code");
      return;
    }

    if (!codeValidation.valid) {
      setError("Please enter a valid client code");
      return;
    }

    if (!user) {
      setError("User not found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await clientCodes.linkToUser(
        clientCode.toUpperCase(),
        user.id
      );
      
      if (result.success) {
        // Dispatch login event to refresh user data and redirect
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGIN));
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to link client code");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Client code linking error:", error);
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
          <p className="mt-4 text-gray-600">Loading...</p>
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
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Key className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link to Your Child</h1>
          <p className="text-gray-600">Connect your account to your child's therapy program</p>
        </div>

        {/* Welcome Message */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Account Created Successfully!</p>
                <p className="text-xs text-green-700">Welcome, {user?.name}!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Code Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl">
              <Key className="w-5 h-5 text-blue-600" />
              <span>Enter Client Code</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter the client code provided by your therapist
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLinkCode} className="space-y-6">
              {/* Client Code Field */}
              <div className="space-y-2">
                <label htmlFor="clientCode" className="text-sm font-medium text-gray-700">
                  Client Code
                </label>
                <div className="relative">
                  <Input
                    id="clientCode"
                    type="text"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    placeholder="Enter your client code"
                    className="h-12 text-base uppercase tracking-wider"
                    maxLength={20}
                    disabled={loading}
                  />
                  {clientCode.length >= 6 && codeValidation.valid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {clientCode.length >= 6 && codeValidation.valid && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-600 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Valid client code - ready to link to your child
                  </motion.p>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>What is a client code?</strong><br />
                      This is a unique code provided by your speech therapist that links your account to your child's therapy program. You should have received this code when your child was enrolled.
                    </p>
                  </div>
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

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1 h-12"
                  disabled={loading}
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-medium text-base"
                  disabled={loading || !codeValidation.valid}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Linking...</span>
                    </div>
                  ) : (
                    <>
                      <span>Link to Child</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have a client code?{" "}
            <span className="text-blue-600">Contact your speech therapist</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
