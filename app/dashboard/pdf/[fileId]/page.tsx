"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-middleware';
import { databases, appwriteConfig } from '@/lib/appwrite.client';
import { fileServiceSimple as fileService } from '@/lib/fileServiceSimple';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Smartphone, 
  Monitor,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  sessionId: string;
  url: string;
  downloadUrl: string;
}

function PDFViewerContent() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.fileId as string;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const screenCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck || screenCheck);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load file data
  useEffect(() => {
    if (fileId) {
      loadFileData();
    }
  }, [fileId]);

  const loadFileData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading file data for ID:', fileId);
      console.log('🔍 Database config:', {
        databaseId: appwriteConfig.databaseId,
        sessionFilesCollection: appwriteConfig.collections.sessionFiles
      });

      // Get file metadata from database
      const fileRecord = await databases.getDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.sessionFiles!,
        fileId
      );

      console.log('📄 File record loaded:', fileRecord);

      const fileData: FileData = {
        id: fileRecord.$id,
        name: fileRecord.fileName,
        type: fileRecord.fileType,
        size: fileRecord.fileSize,
        sessionId: fileRecord.sessionId,
        url: fileService.getFileViewUrl(fileRecord.$id),
        downloadUrl: fileService.getFileDownloadUrl(fileRecord.$id)
      };

      setFileData(fileData);
      console.log('✅ PDF file loaded successfully:', fileData.name);

    } catch (error: any) {
      console.error('❌ Error loading file:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        fileId: fileId
      });
      
      // More specific error message
      if (error.message?.includes('not found')) {
        setError(`Το αρχείο δεν βρέθηκε (ID: ${fileId})`);
      } else if (error.message?.includes('permission')) {
        setError('Δεν έχετε δικαιώματα πρόσβασης σε αυτό το αρχείο');
      } else {
        setError(`Αδυναμία φόρτωσης του αρχείου: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileData) {
      const link = document.createElement('a');
      link.href = fileData.downloadUrl;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openInNewTab = () => {
    if (fileData) {
      window.open(fileData.url, '_blank', 'noopener,noreferrer');
    }
  };

  const openInNativeApp = () => {
    if (fileData) {
      // For mobile, trigger download which often opens in PDF app
      const link = document.createElement('a');
      link.href = fileData.downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      // Don't set download attribute - let browser decide (often opens in PDF app)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const goBack = () => {
    // Try to go back to the session, or fallback to dashboard
    if (fileData?.sessionId) {
      router.push(`/dashboard/session/${fileData.sessionId}`);
    } else {
      router.push('/dashboard');
    }
  };

  const getGoogleDocsViewerUrl = (pdfUrl: string) => {
    return `https://docs.google.com/gviewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Φόρτωση PDF...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !fileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Αδυναμία φόρτωσης PDF</h2>
          <p className="text-gray-600 mb-6">{error || 'Το αρχείο δεν βρέθηκε'}</p>
          <Button onClick={goBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Πίσω</span>
            </Button>
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <h1 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                {fileData.name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {fileService.formatFileSize(fileData.size)}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Κατέβασμα</span>
            </Button>
            
            <Button
              onClick={openInNewTab}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Νέα καρτέλα</span>
            </Button>
            
            {isMobile && (
              <Button
                onClick={openInNativeApp}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Άνοιγμα στην εφαρμογή</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        {isMobile ? (
          // Mobile: Google Docs Viewer + Native app option
          <div className="h-full flex flex-col">
            {/* Mobile guidance banner */}
            <div className="bg-blue-50 border-b p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 text-sm">Βελτιστοποιημένη προβολή για κινητό</h3>
                  <div className="text-xs text-blue-800 mt-2 space-y-1">
                    <p>🔥 <strong>Καλύτερη επιλογή:</strong> Κάντε κλικ "Άνοιγμα στην εφαρμογή" για άριστη ανάγνωση</p>
                    <p>📱 Χρησιμοποιήστε pinch-to-zoom για μεγέθυνση</p>
                    <p>🔄 Περιστρέψτε σε landscape για μεγαλύτερο κείμενο</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Docs Viewer - Excellent mobile support */}
            <div className="flex-1 bg-gray-100">
              <iframe
                src={getGoogleDocsViewerUrl(fileData.url)}
                className="w-full h-full border-0"
                title={fileData.name}
                loading="lazy"
                style={{ minHeight: '500px' }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>

            {/* Mobile action bar */}
            <div className="bg-white border-t p-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={openInNativeApp}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Άνοιγμα στην εφαρμογή
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Κατέβασμα
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Desktop: Enhanced iframe with full controls
          <div className="h-full p-4 bg-gray-100">
            <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Desktop info banner */}
              <div className="bg-gray-50 border-b p-3">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">Desktop PDF Viewer</h3>
                    <p className="text-xs text-gray-600">
                      Πλήρης λειτουργικότητα με zoom, αναζήτηση και εκτύπωση
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF iframe with enhanced parameters */}
              <div className="flex-1">
                <iframe
                  src={`${fileData.url}#toolbar=1&navpanes=1&scrollbar=1&zoom=FitH&view=FitH`}
                  className="w-full h-full border-0"
                  title={fileData.name}
                  loading="lazy"
                  style={{ minHeight: '600px' }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PDFViewerPage() {
  return <PDFViewerContent />;
}
