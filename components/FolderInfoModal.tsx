"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Folder, 
  Calendar, 
  CheckCircle, 
  Clock,
  Eye,
  FolderOpen
} from 'lucide-react';

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

interface Session {
  $id: string;
  folderId: string;
  isPaid: boolean;
  status: string;
}

interface FolderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function FolderInfoModal({ isOpen, onClose, studentId, studentName }: FolderInfoModalProps) {
  const [folders, setFolders] = useState<SessionFolder[]>([]);
  const [folderPaymentStatus, setFolderPaymentStatus] = useState<Record<string, { paid: number; total: number; status: 'paid' | 'pending' | 'empty' }>>({});
  const [loading, setLoading] = useState(false);

  // Load folders and calculate payment status
  useEffect(() => {
    if (isOpen && studentId) {
      loadFoldersWithPaymentStatus();
    }
  }, [isOpen, studentId]);

  const loadFoldersWithPaymentStatus = async () => {
    try {
      setLoading(true);
      
      // Import here to avoid SSR issues
      const { databases, appwriteConfig, Query } = await import('@/lib/appwrite.client');
      
      // Load all folders for this student
      const foldersResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFolders,
        [
          Query.equal('studentId', studentId),
          Query.orderDesc('createdAt')
        ]
      );

      const foldersData = foldersResponse.documents as unknown as SessionFolder[];
      
      // Debug: Check for multiple active folders
      const activeFolders = foldersData.filter(f => f.isActive);
      if (activeFolders.length > 1) {
        console.warn('⚠️ Multiple active folders detected:', activeFolders.map(f => ({ name: f.name, isActive: f.isActive, status: f.status })));
      }
      
      setFolders(foldersData);

      // Load sessions for each folder to calculate payment status
      const paymentStatusMap: Record<string, { paid: number; total: number; status: 'paid' | 'pending' | 'empty' }> = {};

      for (const folder of foldersData) {
        try {
          const sessionsResponse = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.collections.sessions,
            [
              Query.equal('folderId', folder.$id),
              Query.limit(100)
            ]
          );

          const sessions = sessionsResponse.documents as unknown as Session[];
          const totalSessions = sessions.length;
          const paidSessions = sessions.filter(session => session.isPaid).length;

          let status: 'paid' | 'pending' | 'empty' = 'empty';
          if (totalSessions > 0) {
            status = paidSessions === totalSessions ? 'paid' : 'pending';
          }

          paymentStatusMap[folder.$id] = {
            paid: paidSessions,
            total: totalSessions,
            status
          };
        } catch (error) {
          console.error(`Error loading sessions for folder ${folder.name}:`, error);
          paymentStatusMap[folder.$id] = { paid: 0, total: 0, status: 'empty' };
        }
      }

      setFolderPaymentStatus(paymentStatusMap);

    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'paid' | 'pending' | 'empty') => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Πληρωμένο</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Εκκρεμεί</Badge>;
      case 'empty':
        return <Badge className="bg-gray-100 text-gray-600">Χωρίς Συνεδρίες</Badge>;
    }
  };

  const getFolderStatusBadge = (folder: SessionFolder) => {
    // Only show as active if both isActive is true AND status is 'active'
    if (folder.isActive && folder.status === 'active') {
      return <Badge className="bg-blue-100 text-blue-800">Ενεργός</Badge>;
    }
    
    // Show status based on folder.status field
    switch (folder.status) {
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-600">Ολοκληρωμένος</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Παυμένος</Badge>;
      case 'active':
        // If status is active but isActive is false, show as inactive
        return <Badge className="bg-gray-100 text-gray-600">Ανενεργός</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Ανενεργός</Badge>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    Φάκελοι Συνεδριών - {studentName}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Προβολή όλων των φακέλων συνεδριών και της κατάστασης πληρωμής τους
                </p>
              </CardHeader>

              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Φόρτωση φακέλων...</span>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Δεν βρέθηκαν φάκελοι συνεδριών</p>
                  </div>
                ) : (
                  folders.map((folder) => {
                    const paymentInfo = folderPaymentStatus[folder.$id] || { paid: 0, total: 0, status: 'empty' as const };
                    
                    return (
                      <motion.div
                        key={folder.$id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 ${
                          folder.isActive && folder.status === 'active' 
                            ? 'border-blue-300 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                              {getFolderStatusBadge(folder)}
                            </div>
                            
                            {folder.description && (
                              <p className="text-sm text-gray-600 mb-3">{folder.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Ημερομηνία Έναρξης</span>
                                </div>
                                <p className="font-medium">{new Date(folder.startDate).toLocaleDateString('el-GR')}</p>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Συνεδρίες</span>
                                </div>
                                <p className="font-medium">{folder.completedSessions}/{folder.totalSessions}</p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 text-right">
                            <div className="mb-2">
                              {getStatusBadge(paymentInfo.status)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {paymentInfo.total > 0 && (
                                <span>{paymentInfo.paid}/{paymentInfo.total} πληρωμένες</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
