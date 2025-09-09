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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <span className="leading-tight">Φάκελοι Συνεδριών - {studentName}</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="w-8 h-8 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 pr-8 sm:pr-0">
                  Προβολή όλων των φακέλων συνεδριών και της κατάστασης πληρωμής τους
                </p>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto px-4 sm:px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 text-sm sm:text-base">Φόρτωση φακέλων...</span>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">Δεν βρέθηκαν φάκελοι συνεδριών</p>
                  </div>
                ) : (
                  folders.map((folder) => {
                    const paymentInfo = folderPaymentStatus[folder.$id] || { paid: 0, total: 0, status: 'empty' as const };
                    
                    return (
                      <motion.div
                        key={folder.$id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-3 sm:p-4 ${
                          folder.isActive && folder.status === 'active' 
                            ? 'border-blue-300 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">{folder.name}</h3>
                              <div className="flex-shrink-0">
                                {getFolderStatusBadge(folder)}
                              </div>
                            </div>
                            
                            {folder.description && (
                              <p className="text-sm text-gray-600 mb-3">{folder.description}</p>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Ημερομηνία Έναρξης</span>
                                </div>
                                <p className="font-medium text-gray-900">{new Date(folder.startDate).toLocaleDateString('el-GR')}</p>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Συνεδρίες</span>
                                </div>
                                <p className="font-medium text-gray-900">{folder.completedSessions}/{folder.totalSessions}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-0 sm:ml-4">
                            <div className="order-1 sm:order-2">
                              {getStatusBadge(paymentInfo.status)}
                            </div>
                            <div className="text-xs text-gray-500 order-2 sm:order-1 text-left sm:text-right">
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
