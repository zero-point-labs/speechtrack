"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileServiceSimple as fileService } from '@/lib/fileServiceSimple';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Video, 
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  sessionId: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
}

interface FileWithProgress extends File {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  acceptedFileTypes = ['image/*', 'application/pdf', 'video/*'],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  sessionId
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadToAppwrite = async (file: FileWithProgress): Promise<UploadedFile> => {
    try {
      // Update progress to show starting
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 10 } : f
      ));

      // Upload to Appwrite
      const uploadedFile = await fileService.uploadFile(file, sessionId);

      // Update progress incrementally to show completion
      for (let progress = 20; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed' as const } : f
      ));

      return {
        id: uploadedFile.id,
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        url: uploadedFile.url,
        uploadDate: uploadedFile.uploadDate
      };

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'error' as const, error: error.message || 'Σφάλμα μεταφόρτωσης' }
          : f
      ));
      throw error;
    }
  };

  const uploadFiles = async (filesToUpload: FileWithProgress[]) => {
    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of filesToUpload) {
        try {
          const uploadedFile = await uploadToAppwrite(file);
          uploadedFiles.push(uploadedFile);
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: 'Σφάλμα μεταφόρτωσης' }
              : f
          ));
        }
      }

      onFilesUploaded(uploadedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);
    uploadFiles(newFiles);
  }, []);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles: maxFiles - files.length,
    disabled: isUploading
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full 
                ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`
                  w-8 h-8 
                  ${isDragActive ? 'text-blue-500' : 'text-gray-500'}
                `} />
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-blue-600">
                    Αφήστε τα αρχεία εδώ...
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Σύρετε και αφήστε αρχεία εδώ
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    ή κάντε κλικ για επιλογή αρχείων
                  </p>
                  <Button variant="outline" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Μεταφόρτωση...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Επιλογή αρχείων
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status Icon */}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <div className="mt-2 text-xs text-red-500">
                    {file.error}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>Υποστηριζόμενοι τύποι: Εικόνες, PDF, Βίντεο</p>
        <p>Μέγιστο μέγεθος αρχείου: {formatFileSize(maxFileSize)}</p>
        <p>Μέγιστος αριθμός αρχείων: {maxFiles}</p>
      </div>
    </div>
  );
};

export default FileUpload;
