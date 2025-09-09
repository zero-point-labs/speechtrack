"use client";

import React, { useState, useEffect } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import 'react-photo-view/dist/react-photo-view.css';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: string;
    url: string;
    size?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, isOpen, onClose, onDownload }) => {
  const [isMobile, setIsMobile] = useState(false);

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

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('video')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const renderPreview = () => {
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');
    const isImage = fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isVideo = fileType.includes('video') || fileName.match(/\.(mp4|mov|avi|mkv|wmv|flv)$/);

    // PDF Preview - Note: PDFs now open in dedicated page for mobile optimization
    if (isPdf) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-blue-500 mb-4" />
          <p className="text-gray-700 text-center mb-4">
            PDFs τώρα ανοίγουν σε αφιερωμένη σελίδα<br />
            για καλύτερη εμπειρία στο κινητό
          </p>
          <div className="flex gap-2">
            {onDownload && (
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Κατέβασμα
              </Button>
            )}
            <Button onClick={() => window.open(file.url, '_blank')} size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Άνοιγμα PDF
            </Button>
          </div>
        </div>
      );
    }


    // Image Preview
    if (isImage) {
      return (
        <PhotoProvider>
          <PhotoView src={file.url}>
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onError={(e) => {
                console.error('Error loading image:', file.url);
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' font-family='Arial, sans-serif' font-size='18' fill='%236b7280'%3EImage not found%3C/text%3E%3C/svg%3E";
              }}
            />
          </PhotoView>
        </PhotoProvider>
      );
    }

    // Video Preview
    if (isVideo) {
      return (
        <div className="w-full max-w-5xl">
          {/* Video Player - Enhanced Mobile Support */}
          <div 
            className="border border-gray-300 rounded-lg overflow-hidden bg-black shadow-lg"
            style={{ 
              height: isMobile ? '60vh' : '70vh', 
              minHeight: isMobile ? '300px' : '400px' 
            }}
          >
            {/* Mobile-specific guidance */}
            {isMobile && (
              <div className="bg-blue-900/90 text-white p-2 text-xs text-center">
                📱 Πατήστε το κουμπί play για αναπαραγωγή • Χρησιμοποιήστε τα στοιχεία ελέγχου του βίντεο
              </div>
            )}
            
            <video
              src={file.url}
              controls
              className="w-full h-full object-contain"
              style={{
                backgroundColor: '#000',
                borderRadius: isMobile ? '0 0 8px 8px' : '8px'
              }}
              onError={(e) => {
                console.error('Video loading error:', e);
              }}
              onLoadStart={() => {
                console.log('Video loading started');
              }}
              onCanPlay={() => {
                console.log('Video ready to play');
              }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded - ready for mobile playback');
              }}
              // Mobile-optimized attributes
              preload="metadata"
              playsInline
              controlsList="nodownload"
              disablePictureInPicture={false}
              // Additional mobile-specific props
              {...(isMobile && {
                'webkit-playsinline': 'true',
                'x5-video-player-type': 'h5',
                'x5-video-player-fullscreen': 'true'
              })}
            >
              <p className="text-white p-4 text-center">
                Ο browser σας δεν υποστηρίζει αναπαραγωγή βίντεο.
                <br />
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline text-blue-300 hover:text-blue-200"
                >
                  Κατεβάστε το βίντεο
                </a>
              </p>
            </video>
            
            {/* Mobile video controls and fallback */}
            {isMobile && (
              <div className="bg-gray-900/90 p-3 space-y-2">
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      const video = document.querySelector('video') as any;
                      if (video) {
                        if (video.requestFullscreen) {
                          video.requestFullscreen();
                        } else if (video.webkitRequestFullscreen) {
                          video.webkitRequestFullscreen();
                        } else if (video.webkitEnterFullscreen) {
                          video.webkitEnterFullscreen();
                        }
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    📱 Πλήρης Οθόνη
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs no-underline"
                  >
                    🔗 Άνοιγμα Εξωτερικά
                  </a>
                </div>
                <div className="text-center">
                  <a
                    href={file.url}
                    download
                    className="text-blue-300 hover:text-blue-200 text-xs underline"
                  >
                    💾 Κατέβασμα Βίντεο
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <FileText className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Προεπισκόπηση μη διαθέσιμη</p>
        <p className="text-sm">Αυτός ο τύπος αρχείου δεν υποστηρίζεται για προεπισκόπηση</p>
        <Button onClick={onDownload} className="mt-4">
          <Download className="w-4 h-4 mr-2" />
          Κατέβασμα αρχείου
        </Button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
                  <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.type)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {file.name}
                  </h3>
                  {file.size && (
                    <p className="text-sm text-gray-500">{file.size}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDownload}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Λήψη</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preview Content - Full height for PDF viewer */}
            <div className={`${file.type?.includes('pdf') ? 'h-[80vh]' : 'p-4 md:p-6 min-h-[400px]'} flex items-center justify-center overflow-auto`}>
              {renderPreview()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilePreview;
