"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Download, ExternalLink, Smartphone, AlertCircle } from 'lucide-react';

interface MobileVideoPlayerProps {
  url: string;
  fileName: string;
  isMobile: boolean;
}

export default function MobileVideoPlayer({ url, fileName, isMobile }: MobileVideoPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Φόρτωση βίντεο...</p>
        </div>
      </div>
    );
  }

  // For mobile, prioritize external options since in-browser video is problematic
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        {/* Mobile video notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-orange-900 font-medium text-sm mb-2">
                Προβολή Βίντεο στο Κινητό
              </p>
              <p className="text-orange-800 text-sm leading-relaxed">
                Για καλύτερη εμπειρία προβολής στο κινητό, χρησιμοποιήστε μία από τις παρακάτω επιλογές:
              </p>
            </div>
          </div>
        </div>

        {/* Video thumbnail/preview */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
          <div 
            className="w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
            style={{ height: '40vh', minHeight: '200px' }}
          >
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-70" />
              <p className="text-lg font-medium mb-2">{fileName}</p>
              <p className="text-sm text-gray-300">Βίντεο έτοιμο για αναπαραγωγή</p>
            </div>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => window.open(url, '_blank')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
            size="lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Άνοιγμα σε Νέα Καρτέλα
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                // Try to open in device's default video player
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.click();
              }}
              variant="outline"
              className="flex items-center justify-center gap-2 py-3"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">Εφαρμογή Βίντεο</span>
            </Button>
            
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
              }}
              variant="outline"
              className="flex items-center justify-center gap-2 py-3"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Κατέβασμα</span>
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          💡 Συμβουλή: Η αναπαραγωγή βίντεο στο κινητό λειτουργεί καλύτερα σε εξωτερική εφαρμογή
        </div>
      </div>
    );
  }

    // Desktop version - try simple HTML5 video first, then fallback
  return (
    <div className="w-full max-w-5xl">
      <div className="space-y-4">
        {/* Desktop video player */}
        <div 
          className="border border-gray-300 rounded-lg overflow-hidden bg-black shadow-lg"
          style={{ height: '70vh', minHeight: '400px' }}
        >
          <video
            src={url}
            controls
            className="w-full h-full object-contain"
            style={{ backgroundColor: '#000' }}
            onError={() => setVideoError(true)}
            onLoadedMetadata={() => {
              console.log('Desktop video loaded successfully');
            }}
            preload="metadata"
            playsInline
          >
            <p className="text-white p-4 text-center">
              Ο browser σας δεν υποστηρίζει αναπαραγωγή βίντεο.
            </p>
          </video>
        </div>
        
        {/* Desktop fallback options */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => window.open(url, '_blank')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Άνοιγμα σε Νέα Καρτέλα
          </Button>
          
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Κατέβασμα
          </Button>
        </div>
      </div>
    </div>
  );
}
