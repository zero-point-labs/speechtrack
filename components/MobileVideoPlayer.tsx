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
  const [thumbnail, setThumbnail] = useState<string>('');
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (url) {
      generateThumbnail();
    }
  }, [url]);

  const generateThumbnail = () => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      // Seek to 2 seconds or 10% of video duration for thumbnail
      video.currentTime = Math.min(2, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnail(thumbnailUrl);
        }
      } catch (error) {
        console.log('Could not generate thumbnail:', error);
      } finally {
        setThumbnailLoading(false);
        video.remove();
      }
    };
    
    video.onerror = () => {
      console.log('Could not load video for thumbnail');
      setThumbnailLoading(false);
      video.remove();
    };
    
    video.src = url;
  };

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

  return (
    <div className="w-full space-y-4">
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm text-center">
            📱 Πατήστε το κουμπί ▶️ για αναπαραγωγή • Αν δεν λειτουργεί, δοκιμάστε "Νέα Καρτέλα"
          </p>
        </div>
      )}

      {/* Video player with custom thumbnail */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          key={url}
          controls
          playsInline
          preload="metadata"
          poster={thumbnail || undefined}
          className="w-full h-auto"
          style={{ 
            backgroundColor: '#000',
            minHeight: isMobile ? '250px' : '400px',
            maxHeight: isMobile ? '50vh' : '70vh'
          }}
          onError={(e) => {
            console.error('Video error:', e);
            setVideoError(true);
          }}
          onLoadStart={() => console.log('Video loading started')}
          onCanPlay={() => console.log('Video ready to play')}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/quicktime" />
          <source src={url} type="video/x-msvideo" />
          <p className="text-white p-4 text-center">
            Ο browser σας δεν υποστηρίζει αναπαραγωγή βίντεο.
          </p>
        </video>

        {/* Custom thumbnail overlay when video is not playing */}
        {!thumbnailLoading && thumbnail && !isPlaying && (
          <div 
            className="absolute inset-0 bg-cover bg-center cursor-pointer"
            style={{ backgroundImage: `url(${thumbnail})` }}
            onClick={() => {
              const video = document.querySelector('video');
              if (video) {
                video.play();
              }
            }}
          >
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg hover:bg-white transition-colors">
                <Play className="w-10 h-10 text-gray-900 ml-1" />
              </div>
            </div>
            
            {/* Video info overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white font-medium text-sm truncate">{fileName}</p>
                <p className="text-gray-300 text-xs">Πατήστε για αναπαραγωγή</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading thumbnail state */}
        {thumbnailLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Δημιουργία προεπισκόπησης...</p>
            </div>
          </div>
        )}
        
        {videoError && (
          <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="mb-3">Πρόβλημα αναπαραγωγής</p>
              <Button
                onClick={() => window.open(url, '_blank')}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Άνοιγμα Εξωτερικά
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fallback options always available */}
      <div className="flex gap-3">
        <Button
          onClick={() => window.open(url, '_blank')}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {isMobile ? 'Νέα Καρτέλα' : 'Άνοιγμα Εξωτερικά'}
        </Button>
        
        <Button
          onClick={() => {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
          }}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Κατέβασμα
        </Button>
      </div>
    </div>
  );
}
