"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock, 
  CheckCircle,
  XCircle,
  Lock,
  Edit,
  Trash2,
  Plus,
  FileText,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Session {
  $id: string;
  studentId: string;
  folderId: string;
  sessionNumber: number;
  title: string;
  description?: string;
  date: string;
  duration: string;
  status: 'locked' | 'available' | 'completed' | 'cancelled';
  isPaid: boolean;
  therapistNotes?: string;
}

interface SessionFolder {
  $id: string;
  studentId: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
}

interface Student {
  $id: string;
  name: string;
  age?: number;
  parentId: string;
  status: string;
}

interface FolderSessionViewProps {
  folderId: string;
  folderName: string;
  student: Student;
  onBack: () => void;
  onCreateSession: () => void;
  onEditSession: (sessionId: string) => void;
  className?: string;
}

export default function FolderSessionView({ 
  folderId, 
  folderName, 
  student, 
  onBack, 
  onCreateSession,
  onEditSession,
  className = "" 
}: FolderSessionViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [folder, setFolder] = useState<SessionFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Load sessions for folder
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");

      // Get sessions in folder
      const sessionsResponse = await fetch(`/api/admin/session-folders/${folderId}/sessions`);
      const sessionsData = await sessionsResponse.json();

      if (sessionsData.success) {
        setSessions(sessionsData.sessions || []);
      } else {
        setError(sessionsData.error || "Failed to load sessions");
      }

      // Get folder details
      const folderResponse = await fetch(`/api/admin/session-folders/${folderId}`);
      const folderData = await folderResponse.json();

      if (folderData.success && folderData.folder) {
        setFolder(folderData.folder);
      }

    } catch (error) {
      console.error("Error loading sessions:", error);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (folderId) {
      loadSessions();
    }
  }, [folderId]);

  // Delete session
  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError("");
      
      // Use existing session deletion API
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess(`Session "${sessionTitle}" deleted successfully`);
        await loadSessions(); // Reload sessions
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      setError("Failed to delete session");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': 
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': 
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'locked': 
        return <Lock className="w-4 h-4 text-gray-600" />;
      case 'cancelled': 
        return <XCircle className="w-4 h-4 text-red-600" />;
      default: 
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (session: Session) => {
    const baseClasses = "text-xs flex items-center space-x-1";
    
    switch (session.status) {
      case 'available':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-300`}>
            {getStatusIcon(session.status)}
            <span>Available</span>
          </Badge>
        );
      case 'completed':
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-300`}>
            {getStatusIcon(session.status)}
            <span>Completed</span>
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="outline" className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-300`}>
            {getStatusIcon(session.status)}
            <span>Locked</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className={`${baseClasses} bg-red-100 text-red-800 border-red-300`}>
            {getStatusIcon(session.status)}
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={baseClasses}>
            {getStatusIcon(session.status)}
            <span>{session.status}</span>
          </Badge>
        );
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{folderName}</h2>
            <p className="text-gray-600">Sessions for {student.name}</p>
          </div>
        </div>
        <Button
          onClick={onCreateSession}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Session</span>
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
        >
          {success}
        </motion.div>
      )}

      {/* Folder Info */}
      {folder && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{folder.totalSessions}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{folder.completedSessions}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {folder.totalSessions - folder.completedSessions}
                </p>
                <p className="text-sm text-gray-600">Remaining</p>
              </div>
              <div className="text-center">
                <Badge 
                  className={folder.isActive 
                    ? "bg-green-100 text-green-800 border-green-300" 
                    : "bg-gray-100 text-gray-800 border-gray-300"
                  }
                >
                  {folder.isActive ? "Active Folder" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">
              This folder doesn't have any sessions yet. Create your first session to get started.
            </p>
            <Button
              onClick={onCreateSession}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Session</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session.$id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {session.displaySessionNumber || session.sessionNumber}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {session.title}
                          </h4>
                          {getStatusBadge(session)}
                          {session.isPaid && (
                            <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                              Paid
                            </Badge>
                          )}
                        </div>
                        
                        {session.description && (
                          <p className="text-sm text-gray-600 truncate mb-2">
                            {session.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(session.date).toLocaleDateString('el-GR')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.duration}
                          </span>
                          {session.therapistNotes && (
                            <span className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              Has Notes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => onEditSession(session.$id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        onClick={() => handleDeleteSession(session.$id, session.title)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
