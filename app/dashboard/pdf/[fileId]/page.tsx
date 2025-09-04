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

      // Use server API instead of direct database access to avoid auth issues
      const response = await fetch(`/api/file-info/${fileId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load file info');
      }

      const fileData = await response.json();
      
      console.log('✅ PDF file loaded via API:', fileData.name);
      setFileData(fileData);

    } catch (error: any) {
      console.error('❌ Error loading file:', error);
      
      // More specific error message
      if (error.message?.includes('not found') || error.message?.includes('404')) {
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

  const getEnhancedPDFUrl = (pdfUrl: string, isMobile: boolean) => {
    // Enhanced PDF viewing parameters for better mobile/desktop experience
    if (isMobile) {
      // Mobile: Fit to width, minimal UI for more reading space
      return `${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&zoom=FitV&view=FitV`;
    } else {
      // Desktop: Full features with fit to height
      return `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=FitH&view=FitH`;
    }
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
    <div className={`${isMobile ? 'mobile-pdf-page' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
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

            {/* Enhanced Mobile PDF Iframe */}
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                src={getEnhancedPDFUrl(fileData.url, true)}
                className="w-full h-full border-0 mobile-pdf-iframe"
                title={fileData.name}
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                style={{ 
                  minHeight: '500px',
                  // Mobile iframe optimizations
                  width: '100%',
                  height: '100%'
                }}
                onLoad={() => {
                  console.log('📱 Enhanced mobile PDF loaded successfully');
                }}
                onError={() => {
                  console.log('⚠️ PDF iframe error - showing fallback options');
                }}
              />
              
            </div>

            {/* Enhanced Mobile action bar */}
            <div className="bg-white border-t p-4 space-y-3">
              {/* Primary action - Native app */}
              <Button
                onClick={openInNativeApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                size="lg"
              >
                <Smartphone className="w-5 h-5 mr-3" />
                Άνοιγμα στην εφαρμογή PDF
              </Button>
              
              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="py-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Κατέβασμα
                </Button>
                <Button
                  onClick={openInNewTab}
                  variant="outline"
                  className="py-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Νέα καρτέλα
                </Button>
              </div>
              
            </div>
          </div>
        ) : (
          // Desktop: Enhanced iframe with full controls
          <div className="h-full p-4 bg-gray-100">
            <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">

              {/* Enhanced Desktop PDF Viewer */}
              <div className="flex-1">
                <iframe
                  src={getEnhancedPDFUrl(fileData.url, false)}
                  className="w-full h-full border-0"
                  title={fileData.name}
                  loading="lazy"
                  style={{ minHeight: '600px' }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  onLoad={() => {
                    console.log('🖥️ Enhanced desktop PDF loaded');
                  }}
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
