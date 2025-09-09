"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ParentRoute } from '@/lib/auth-middleware';
import { fileServiceSimple as fileService } from '@/lib/fileServiceSimple';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw
} from 'lucide-react';

interface VideoFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
}

function VideoPageContent() {
  const router = useRouter();
  const params = useParams();
  const fileId = params?.fileId as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);

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

  // Load video file information
  useEffect(() => {
    const loadVideoFile = async () => {
      if (!fileId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get file info from API
        const response = await fetch(`/api/file-info/${fileId}`);
        
        if (!response.ok) {
          throw new Error('Το αρχείο δεν βρέθηκε');
        }

        const fileInfo = await response.json();
        
        setVideoFile({
          id: fileInfo.id,
          name: fileInfo.name,
          url: fileInfo.url,
          type: fileInfo.type || 'video/mp4',
          size: fileInfo.size ? fileService.formatFileSize(parseInt(fileInfo.size)) : undefined
        });
      } catch (err) {
        console.error('Error loading video:', err);
        setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης βίντεο');
      } finally {
        setLoading(false);
      }
    };

    loadVideoFile();
  }, [fileId]);

  // Auto-hide controls on mobile after 3 seconds
  useEffect(() => {
    if (!isMobile) return;

    let hideTimeout: NodeJS.Timeout;
    
    const resetHideTimeout = () => {
      clearTimeout(hideTimeout);
      setShowControls(true);
      hideTimeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    resetHideTimeout();
    
    return () => clearTimeout(hideTimeout);
  }, [isPlaying, isMobile]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
        setVideoError(true);
      });
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if ((videoRef.current as any).webkitEnterFullscreen) {
      // iOS Safari fullscreen
      (videoRef.current as any).webkitEnterFullscreen();
    }
  };

  const handleReload = () => {
    if (!videoRef.current) return;
    
    setVideoError(false);
    videoRef.current.load();
  };

  const handleDownload = () => {
    if (!videoFile) return;
    
    const link = document.createElement('a');
    link.href = videoFile.url;
    link.download = videoFile.name;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Φόρτωση βίντεο...</p>
        </div>
      </div>
    );
  }

  if (error || !videoFile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-semibold mb-2">Σφάλμα φόρτωσης</h1>
          <p className="text-gray-300 mb-6">{error || 'Το βίντεο δεν μπόρεσε να φορτωθεί'}</p>
          <Button onClick={() => router.back()} className="bg-white text-black hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header - only show when controls are visible or on desktop */}
      <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls || !isMobile ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Λήψη</span>
            </Button>
            
            <Button
              onClick={() => window.open(videoFile.url, '_blank')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Νέα καρτέλα</span>
            </Button>
          </div>
        </div>
        
        {/* Video title */}
        <div className="mt-2">
          <h1 className="text-white text-lg font-medium truncate">{videoFile.name}</h1>
          {videoFile.size && (
            <p className="text-gray-300 text-sm">{videoFile.size}</p>
          )}
        </div>
      </div>

      {/* Video container */}
      <div 
        className="relative w-full h-screen flex items-center justify-center"
        onClick={() => {
          if (isMobile) {
            setShowControls(!showControls);
          }
        }}
      >
        {videoError ? (
          <div className="text-center text-white p-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2">Πρόβλημα αναπαραγωγής</h2>
            <p className="text-gray-300 mb-6">
              Το βίντεο δεν μπόρεσε να αναπαραχθεί. Δοκιμάστε να το ανοίξετε σε νέα καρτέλα.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleReload} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Επανάληψη
              </Button>
              <Button onClick={() => window.open(videoFile.url, '_blank')} variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Άνοιγμα εξωτερικά
              </Button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="max-w-full max-h-full w-auto h-auto"
            controls={!isMobile} // Use native controls on desktop
            playsInline
            preload="metadata"
            webkit-playsinline="true"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Video playback error:', e);
              setVideoError(true);
            }}
            onLoadStart={() => console.log('Video loading started')}
            onCanPlay={() => console.log('Video can play')}
            onVolumeChange={(e) => {
              const video = e.target as HTMLVideoElement;
              setIsMuted(video.muted);
            }}
          >
            <source src={videoFile.url} type="video/mp4" />
            <source src={videoFile.url} type="video/quicktime" />
            <source src={videoFile.url} type="video/webm" />
            <p className="text-white text-center p-4">
              Ο browser σας δεν υποστηρίζει αναπαραγωγή βίντεο.
              <br />
              <Button 
                onClick={() => window.open(videoFile.url, '_blank')} 
                className="mt-2"
              >
                Κατέβασμα βίντεο
              </Button>
            </p>
          </video>
        )}

        {/* Custom mobile controls */}
        {isMobile && !videoError && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center justify-center space-x-6">
              <Button
                onClick={handleMuteToggle}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
              
              <Button
                onClick={handlePlayPause}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
              
              <Button
                onClick={handleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile help text */}
      {isMobile && (
        <div className={`absolute top-20 left-4 right-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-blue-900/80 backdrop-blur-sm text-white text-sm p-3 rounded-lg text-center">
            📱 Πατήστε το βίντεο για να εμφανίσετε/αποκρύψετε τα χειριστήρια
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoPage() {
  return (
    <ParentRoute>
      <VideoPageContent />
    </ParentRoute>
  );
}
