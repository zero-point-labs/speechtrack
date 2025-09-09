"use client";

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  videoName: string;
  className?: string;
}

export default function VideoThumbnail({ videoUrl, videoName, className = "" }: VideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    generateThumbnail();
  }, [videoUrl]);

  const generateThumbnail = async () => {
    try {
      setLoading(true);
      setError(false);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      // Promise-based approach for better control
      const loadVideo = new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Seek to 2 seconds or 10% of video duration for thumbnail
          video.currentTime = Math.min(2, video.duration * 0.1);
        };
        
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              // Set canvas size to video dimensions
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Draw the video frame
              ctx.drawImage(video, 0, 0);
              
              // Convert to data URL
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
              setThumbnail(thumbnailUrl);
              resolve();
            } else {
              reject(new Error('Invalid video dimensions'));
            }
          } catch (error) {
            reject(error);
          } finally {
            video.remove();
          }
        };
        
        video.onerror = () => {
          reject(new Error('Video load error'));
          video.remove();
        };
        
        // Set timeout to prevent hanging
        setTimeout(() => {
          reject(new Error('Thumbnail generation timeout'));
          video.remove();
        }, 10000);
      });

      video.src = videoUrl;
      await loadVideo;
      
    } catch (error) {
      console.log('Could not generate thumbnail for', videoName, ':', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`aspect-video bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Δημιουργία προεπισκόπησης...</p>
        </div>
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-600">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-70" />
          <p className="text-xs font-medium">{videoName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video relative overflow-hidden ${className}`}>
      {/* Video thumbnail */}
      <img 
        src={thumbnail} 
        alt={`Thumbnail για ${videoName}`}
        className="w-full h-full object-cover"
      />
      
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-black/80 transition-colors">
          <Play className="w-8 h-8 text-white ml-1" />
        </div>
      </div>
      
      {/* Video duration overlay */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        βίντεο
      </div>
    </div>
  );
}
