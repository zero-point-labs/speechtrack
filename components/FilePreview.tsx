"use client";

import React, { useState } from 'react';
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

    // PDF Preview - Fixed and Mobile Responsive
    if (isPdf) {
      return (
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* PDF Controls - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-gray-100 rounded-lg p-3 w-full">
            <Button 
              onClick={() => window.open(file.url, '_blank')}
              variant="default" 
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Άνοιγμα σε νέα καρτέλα
            </Button>
            {onDownload && (
              <Button 
                onClick={onDownload} 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Κατέβασμα PDF
              </Button>
            )}
          </div>

          {/* PDF Viewer - Responsive */}
          <div className="w-full max-w-5xl">
            <div 
              className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg"
              style={{ 
                height: '70vh', 
                minHeight: '400px',
                maxHeight: '600px'
              }}
            >
              <iframe
                src={file.url}
                className="w-full h-full"
                title={file.name}
                style={{
                  border: 'none'
                }}
                onLoad={() => {
                  console.log('PDF loaded successfully in iframe');
                }}
                onError={(e) => {
                  console.error('PDF iframe error:', e);
                }}
              />
            </div>
          </div>

          {/* Help text - Mobile aware */}
          <div className="text-center text-sm text-gray-600 max-w-md px-4">
            <p className="hidden sm:block">Αν το PDF δεν εμφανίζεται σωστά, κάντε κλικ στο "Άνοιγμα σε νέα καρτέλα" για καλύτερη προβολή.</p>
            <p className="sm:hidden">Για καλύτερη προβολή, κάντε κλικ στο "Άνοιγμα σε νέα καρτέλα".</p>
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
          {/* Video Player - Mobile Responsive */}
          <div 
            className="border border-gray-300 rounded-lg overflow-hidden bg-black shadow-lg"
            style={{ height: '70vh', minHeight: '400px' }}
          >
            <video
              src={file.url}
              controls
              className="w-full h-full object-contain"
              style={{
                backgroundColor: '#000',
                borderRadius: '8px'
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
              preload="metadata"
              playsInline
            >
              <p className="text-white p-4">Ο browser σας δεν υποστηρίζει αναπαραγωγή βίντεο.</p>
            </video>
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

            {/* Preview Content */}
            <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px] overflow-auto">
              {renderPreview()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilePreview;
