"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Maximize2,
  FileText,
  Eye,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobilePDFViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload?: () => void;
  onClose?: () => void;
}

export default function MobilePDFViewer({ fileUrl, fileName, onDownload, onClose }: MobilePDFViewerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const openFullscreen = useCallback(() => {
    window.open(fileUrl, '_blank');
  }, [fileUrl]);

  const openInApp = useCallback(() => {
    if (isMobile) {
      // For mobile, try to open in native PDF viewer
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      openFullscreen();
    }
  }, [fileUrl, isMobile, openFullscreen]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{fileName}</h3>
          <Badge variant="secondary" className="text-xs">
            PDF
          </Badge>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {onDownload && (
            <Button size="sm" variant="outline" onClick={onDownload} className="text-xs">
              <Download className="w-3 h-3 mr-1" />
              Κατέβασμα
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={openInApp} className="text-xs">
            <ExternalLink className="w-3 h-3 mr-1" />
            {isMobile ? 'Άνοιγμα στην εφαρμογή' : 'Πλήρης οθόνη'}
          </Button>
        </div>
      </div>

      {/* Mobile-optimized PDF viewer */}
      <div className="flex-1 relative">
        {isMobile ? (
          // Mobile: Enhanced iframe with mobile-optimized settings
          <div className="h-full flex flex-col">
            <div className="bg-blue-50 border-b p-3">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 text-sm">Βελτιωμένη προβολή για κινητό</h4>
                  <div className="text-xs text-blue-800 mt-1 space-y-1">
                    <p>• Για καλύτερη ανάγνωση κάντε κλικ "Άνοιγμα στην εφαρμογή"</p>
                    <p>• Χρησιμοποιήστε pinch-to-zoom για μεγέθυνση</p>
                    <p>• Περιστρέψτε το τηλέφωνο για landscape προβολή</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-100">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&zoom=FitV`}
                className="w-full h-full border-0"
                title={fileName}
                loading="lazy"
                sandbox="allow-same-origin allow-scripts"
                style={{
                  minHeight: '500px'
                }}
                onLoad={() => {
                  setLoading(false);
                  console.log('📱 Mobile PDF loaded successfully');
                }}
              />
            </div>
            
            {/* Mobile action bar */}
            <div className="bg-white border-t p-3">
              <div className="flex items-center gap-2">
                <Button onClick={openInApp} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Άνοιγμα στην εφαρμογή PDF
                </Button>
                {onDownload && (
                  <Button onClick={onDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Κατέβασμα
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Desktop: Standard iframe with zoom controls
          <div className="h-full p-4 bg-gray-100">
            <div className="h-full border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=FitH`}
                className="w-full h-full border-0"
                title={fileName}
                loading="lazy"
                onLoad={() => {
                  setLoading(false);
                  console.log('🖥️ Desktop PDF loaded successfully');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
