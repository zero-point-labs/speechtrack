"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRoute, useLogout } from "@/lib/auth-middleware";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SessionManagement from "@/components/SessionManagement";
import { motion } from "framer-motion";
import { 
  Plus, 
  Calendar,
  Users,
  MessageCircle,
  Settings,
  LogOut
} from "lucide-react";

function AdminPageContent() {
  const router = useRouter();
  const logout = useLogout();
  const [activeTab, setActiveTab] = useState("sessions");

  const tabs = [
    { id: "sessions", label: "Session Management", icon: Calendar },
    { id: "students", label: "Students", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "sessions":
        return <SessionManagement />;
      case "students":
        return (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Student Management</h3>
            <p className="text-gray-600 mb-6">Manage student profiles and information</p>
            <Button onClick={() => router.push('/admin/create-student')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Student
            </Button>
          </div>
        );
      case "messages":
        return (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Messages</h3>
            <p className="text-gray-600">Communication with parents (Coming Soon)</p>
          </div>
        );
      case "settings":
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">System configuration (Coming Soon)</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage therapy sessions and students</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/admin/create-student')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Student
            </Button>
            <Button onClick={logout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminPageContent />
    </AdminRoute>
  );
}
