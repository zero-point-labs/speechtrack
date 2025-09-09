"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Play, Download, ExternalLink, Smartphone } from 'lucide-react';

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Φόρτωση βίντεο...</p>
      </div>
    </div>
  )
});

interface MobileVideoPlayerProps {
  url: string;
  fileName: string;
  isMobile: boolean;
}

export default function MobileVideoPlayer({ url, fileName, isMobile }: MobileVideoPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

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

  if (hasError) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-6 text-center space-y-4">
        <div className="text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium mb-2">Πρόβλημα αναπαραγωγής βίντεο</p>
          <p className="text-sm">Δοκιμάστε τις παρακάτω επιλογές:</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => window.open(url, '_blank')}
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
            Κατέβασμα Βίντεο
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Mobile guidance */}
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>Πατήστε play για αναπαραγωγή. Για καλύτερη εμπειρία, χρησιμοποιήστε πλήρη οθόνη.</span>
          </div>
        </div>
      )}

      {/* Video Player Container */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <div style={{ 
          height: isMobile ? '50vh' : '60vh', 
          minHeight: isMobile ? '250px' : '400px' 
        }}>
          <ReactPlayer
            url={url}
            width="100%"
            height="100%"
            controls={true}
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={(error) => {
              console.error('ReactPlayer error:', error);
              setHasError(true);
            }}
            onReady={() => {
              console.log('ReactPlayer ready for mobile playback');
            }}
            // Mobile-optimized config
            config={{
              file: {
                attributes: {
                  playsInline: true,
                  preload: 'metadata',
                  controlsList: 'nodownload',
                  ...(isMobile && {
                    'webkit-playsinline': 'true',
                    'x5-video-player-type': 'h5',
                    'x5-video-player-fullscreen': 'true'
                  })
                }
              }
            }}
            // Enhanced mobile support
            playsinline={true}
            pip={false}
            light={false}
            fallback={
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-70" />
                  <p className="mb-4">Φόρτωση βίντεο...</p>
                  <Button
                    onClick={() => setHasError(true)}
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-gray-900"
                  >
                    Εμφάνιση Εναλλακτικών
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Mobile action buttons */}
      {isMobile && (
        <div className="flex gap-3">
          <Button
            onClick={() => window.open(url, '_blank')}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Εξωτερική Εφαρμογή
          </Button>
          
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();
            }}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Κατέβασμα
          </Button>
        </div>
      )}
    </div>
  );
}
