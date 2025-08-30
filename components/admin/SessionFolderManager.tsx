"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FolderPlus, 
  FolderOpen, 
  Settings, 
  Trash2, 
  Eye, 
  Plus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Clock,
  Save
} from "lucide-react";
import { motion } from "framer-motion";

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
  createdAt: string;
  updatedAt: string;
}

interface Student {
  $id: string;
  name: string;
  age?: number;
  parentId: string;
  status: string;
}

// Session template interface
interface SessionTemplate {
  dayOfWeek: string;
  time: string;
  duration: number; // in minutes
}

// Session setup form data
interface SessionSetupData {
  totalWeeks: number;
  sessionsPerWeek: number;
  sessionTemplates: SessionTemplate[];
}

interface SessionFolderManagerProps {
  student: Student;
  onCreateSession: (folderId: string) => void;
  onViewFolderSessions: (folderId: string, folderName: string) => void;
  className?: string;
}

export default function SessionFolderManager({ 
  student, 
  onCreateSession, 
  onViewFolderSessions,
  className = "" 
}: SessionFolderManagerProps) {
  const [folders, setFolders] = useState<SessionFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create folder form state
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  
  // Session setup state
  const [sessionSetup, setSessionSetup] = useState<SessionSetupData>({
    totalWeeks: 12,
    sessionsPerWeek: 1,
    sessionTemplates: [{
      dayOfWeek: 'monday',
      time: '10:00',
      duration: 45
    }]
  });

  // Load folders for student
  const loadFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/session-folders?studentId=${student.$id}`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders || []);
      } else {
        setError(data.error || "Failed to load folders");
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      setError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student.$id) {
      loadFolders();
    }
  }, [student.$id]);

  // Session setup handlers
  const handleWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weeks = parseInt(e.target.value) || 12;
    setSessionSetup(prev => ({ 
      ...prev, 
      totalWeeks: weeks 
    }));
  };

  const handleSessionsPerWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessions = parseInt(e.target.value);
    setSessionSetup(prev => {
      const currentTemplates = prev.sessionTemplates;
      let newTemplates: SessionTemplate[];

      if (sessions > currentTemplates.length) {
        // Add new templates
        newTemplates = [...currentTemplates];
        for (let i = currentTemplates.length; i < sessions; i++) {
          newTemplates.push({
            dayOfWeek: 'monday',
            time: '10:00',
            duration: 45
          });
        }
      } else {
        // Remove excess templates
        newTemplates = currentTemplates.slice(0, sessions);
      }

      return {
        ...prev,
        sessionsPerWeek: sessions,
        sessionTemplates: newTemplates
      };
    });
  };

  const handleTemplateChange = (index: number, field: keyof SessionTemplate, value: string | number) => {
    setSessionSetup(prev => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    }));
  };

  // Create new folder with sessions
  const handleCreateFolder = async () => {
    console.log('🎬 STARTING handleCreateFolder function');
    
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }

    // Validation
    if (sessionSetup.totalWeeks < 1 || sessionSetup.totalWeeks > 52) {
      setError('Total weeks must be between 1 and 52');
      return;
    }

    if (sessionSetup.sessionsPerWeek < 1 || sessionSetup.sessionsPerWeek > 7) {
      setError('Sessions per week must be between 1 and 7');
      return;
    }

    // Prevent multiple simultaneous calls
    if (creating) {
      console.log('⚠️ Already creating folder, ignoring duplicate call');
      return;
    }

    try {
      setCreating(true);
      setError("");
      console.log('🎯 Starting folder creation process');

      // Step 1: Create the folder
      const folderResponse = await fetch('/api/admin/session-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.$id,
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || `${sessionSetup.totalWeeks} weeks therapy program`,
          setActive: folders.length === 0 // Set as active if it's the first folder
        })
      });

      const folderData = await folderResponse.json();

      if (!folderData.success) {
        throw new Error(folderData.error || "Failed to create folder");
      }

      const folderId = folderData.folder.$id;

      // Step 2: Session numbering should be per-folder, starting from 1
      // Each folder gets its own session numbering: 1, 2, 3, ..., 12
      let startingSessionNumber = 1;
      console.log(`📊 Creating sessions for NEW folder - starting session numbering from 1`);

      // Step 3: Create sessions in the folder
      const sessions = [];
      const startDate = new Date();
      
      for (let week = 0; week < sessionSetup.totalWeeks; week++) {
        for (let sessionIndex = 0; sessionIndex < sessionSetup.sessionsPerWeek; sessionIndex++) {
          const template = sessionSetup.sessionTemplates[sessionIndex];
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + (week * 7));
          
          const sessionNumber = startingSessionNumber + (week * sessionSetup.sessionsPerWeek) + sessionIndex;
          
          sessions.push({
            studentId: student.$id,
            folderId: folderId,
            sessionNumber: sessionNumber,
            title: `Session ${sessionNumber}`,
            description: `${template.duration} minute session`,
            date: sessionDate.toISOString().split('T')[0], // Use YYYY-MM-DD format
            duration: `${template.duration} λεπτά`, // Use Greek format like the API expects
            status: sessionNumber === startingSessionNumber ? 'available' : 'locked',
            isPaid: false
          });
        }
      }

      console.log(`📝 About to create ${sessions.length} sessions for folder ${folderId}`);
      console.log('📋 Session details:', sessions.map(s => ({ sessionNumber: s.sessionNumber, title: s.title })));
      
      // Create all sessions SEQUENTIALLY to avoid race conditions
      let successCount = 0;
      let failCount = 0;
      
      console.log('🚀 Creating sessions sequentially to avoid ID conflicts...');
      
      for (let i = 0; i < sessions.length; i++) {
        const sessionData = sessions[i];
        
        try {
          console.log(`📝 Creating session ${i + 1}/${sessions.length} (Session #${sessionData.sessionNumber})...`);
          
          const sessionResponse = await fetch(`/api/admin/session-folders/${folderId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
          });

          const sessionResult = await sessionResponse.json();
          
          if (sessionResult.success) {
            successCount++;
            console.log(`✅ Session ${sessionData.sessionNumber} created successfully`);
          } else {
            failCount++;
            console.error(`❌ Failed to create session ${sessionData.sessionNumber}:`, sessionResult.error);
            
            if (failCount <= 3) {
              setError(`Failed to create session ${sessionData.sessionNumber}: ${sessionResult.error}`);
            }
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Network error creating session ${sessionData.sessionNumber}:`, error);
          
          if (failCount <= 3) {
            setError(`Network error creating session ${sessionData.sessionNumber}: ${error.message}`);
          }
        }
        
        // Add a small delay between requests to prevent overwhelming the server
        if (i < sessions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`📊 Session creation complete: ${successCount} successful, ${failCount} failed`);
      
      if (failCount > 0) {
        setError(`Created folder but ${failCount}/${sessions.length} sessions failed to create. Check console for details.`);
      }

      setSuccess(`Created folder "${folderData.folder.name}" with ${sessions.length} sessions`);
      
      // Reset form
      setNewFolderName("");
      setNewFolderDescription("");
      setSessionSetup({
        totalWeeks: 12,
        sessionsPerWeek: 1,
        sessionTemplates: [{
          dayOfWeek: 'monday',
          time: '10:00',
          duration: 45
        }]
      });
      setShowCreateForm(false);
      
      await loadFolders(); // Reload folders
      
      console.log('🎉 COMPLETED handleCreateFolder function successfully');

    } catch (error) {
      console.error("💥 Error creating folder with sessions:", error);
      setError(error instanceof Error ? error.message : "Failed to create folder with sessions");
    } finally {
      setCreating(false);
      console.log('🏁 FINISHED handleCreateFolder function (finally block)');
    }
  };

  // Set folder as active
  const handleSetActive = async (folderId: string, folderName: string) => {
    try {
      setError("");
      
      const response = await fetch(`/api/admin/session-folders/${folderId}/set-active`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`"${folderName}" is now the active folder`);
        await loadFolders(); // Reload to update active status
      } else {
        setError(data.error || "Failed to set active folder");
      }
    } catch (error) {
      console.error("Error setting active folder:", error);
      setError("Failed to set active folder");
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string, folderName: string, hasSessions: boolean) => {
    const confirmMessage = hasSessions 
      ? `Are you sure you want to delete "${folderName}"? This will also delete all ${hasSessions} sessions in this folder. This action cannot be undone.`
      : `Are you sure you want to delete "${folderName}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setError("");
      
      const response = await fetch(`/api/admin/session-folders/${folderId}?cascade=${hasSessions}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        await loadFolders(); // Reload folders
      } else {
        setError(data.error || "Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      setError("Failed to delete folder");
    }
  };

  const getStatusBadge = (folder: SessionFolder) => {
    if (folder.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    switch (folder.status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            Completed
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {folder.status}
          </Badge>
        );
    }
  };

  const getFolderIcon = (folder: SessionFolder) => {
    if (folder.isActive) {
      return <FolderOpen className="w-5 h-5 text-green-600" />;
    }
    return <Folder className="w-5 h-5 text-gray-600" />;
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
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Folder className="w-5 h-5 mr-2 text-blue-600" />
          Session Folders for {student.name}
        </h3>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
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

      {/* Create Folder Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FolderPlus className="w-5 h-5 mr-2 text-blue-600" />
                Create New Session Folder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Folder Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Name *
                  </label>
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., 2024 Therapy Program, Advanced Speech Training"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <Input
                    type="text"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Brief description of this therapy period"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Session Template Configuration */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Session Template Configuration
                </h4>

                {/* Total Weeks and Sessions Per Week */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Weeks *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={sessionSetup.totalWeeks}
                      onChange={handleWeeksChange}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total program: {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} sessions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sessions per Week *
                    </label>
                    <select
                      value={sessionSetup.sessionsPerWeek}
                      onChange={handleSessionsPerWeekChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'time' : 'times'} per week
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Session Templates */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">Session Schedule</h5>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                      {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'session' : 'sessions'} / week
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {sessionSetup.sessionTemplates.map((template, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-900">Session {index + 1}</h6>
                          <Clock className="w-4 h-4 text-purple-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Day of Week */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                            <select
                              value={template.dayOfWeek}
                              onChange={(e) => handleTemplateChange(index, 'dayOfWeek', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="monday">Monday</option>
                              <option value="tuesday">Tuesday</option>
                              <option value="wednesday">Wednesday</option>
                              <option value="thursday">Thursday</option>
                              <option value="friday">Friday</option>
                              <option value="saturday">Saturday</option>
                              <option value="sunday">Sunday</option>
                            </select>
                          </div>

                          {/* Time */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                            <Input
                              type="time"
                              value={template.time}
                              onChange={(e) => handleTemplateChange(index, 'time', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                            <select
                              value={template.duration}
                              onChange={(e) => handleTemplateChange(index, 'duration', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                              <option value={90}>90 minutes</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-medium text-blue-900 mb-2">Summary</h6>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• {sessionSetup.totalWeeks} weeks program</p>
                    <p>• {sessionSetup.sessionsPerWeek} {sessionSetup.sessionsPerWeek === 1 ? 'session' : 'sessions'} per week</p>
                    <p>• Total {sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} sessions</p>
                    <p>• Duration per session: {sessionSetup.sessionTemplates[0]?.duration || 45} minutes</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🔘 Create button clicked, creating state:', creating);
                    if (!creating) {
                      handleCreateFolder();
                    } else {
                      console.log('⚠️ Button clicked while already creating, ignoring');
                    }
                  }}
                  disabled={creating || !newFolderName.trim()}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{creating ? "Creating..." : `Create Folder with ${sessionSetup.totalWeeks * sessionSetup.sessionsPerWeek} Sessions`}</span>
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Folders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
      ) : folders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Session Folders</h3>
            <p className="text-gray-600 mb-4">
              Create your first session folder to organize this student's therapy sessions.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create First Folder</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {folders.map((folder) => (
            <motion.div
              key={folder.$id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getFolderIcon(folder)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {folder.name}
                          </h4>
                          {getStatusBadge(folder)}
                        </div>
                        {folder.description && (
                          <p className="text-sm text-gray-600 truncate">
                            {folder.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(folder.startDate).toLocaleDateString('el-GR')}
                          </span>
                          <span>
                            {folder.completedSessions}/{folder.totalSessions} sessions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => onViewFolderSessions(folder.$id, folder.name)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>

                      <Button
                        onClick={() => onCreateSession(folder.$id)}
                        size="sm"
                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Session</span>
                      </Button>

                      {!folder.isActive && (
                        <Button
                          onClick={() => handleSetActive(folder.$id, folder.name)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Set Active</span>
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDeleteFolder(folder.$id, folder.name, folder.totalSessions > 0)}
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

      {/* Summary */}
      {folders.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{folders.length}</p>
                <p className="text-sm text-gray-600">Total Folders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {folders.reduce((sum, f) => sum + f.totalSessions, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {folders.reduce((sum, f) => sum + f.completedSessions, 0)}
                </p>
                <p className="text-sm text-gray-600">Completed Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
