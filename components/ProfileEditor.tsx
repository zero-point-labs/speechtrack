"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Phone, 
  Mail,
  User,
  Upload,
  Loader2
} from 'lucide-react';

interface ProfileEditorProps {
  user: any;
  linkedStudent: any;
  parentContact: any;
  onSave: (updatedData: { phone: string; profilePicture?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileEditor({ 
  user, 
  linkedStudent, 
  parentContact, 
  onSave, 
  onCancel 
}: ProfileEditorProps) {
  const [phone, setPhone] = useState(parentContact.phone === '-' ? '' : parentContact.phone);
  const [profilePicture, setProfilePicture] = useState(parentContact.profilePicture || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', 'profile-pictures'); // Use a special folder for profile pictures

      // Upload to R2 via our existing upload API
      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setProfilePicture(result.url);
      
      console.log('✅ Profile picture uploaded:', result.url);
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      alert('Σφάλμα κατά τη μεταφόρτωση της φωτογραφίας');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Παρακαλώ επιλέξτε μια εικόνα');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Η εικόνα είναι πολύ μεγάλη. Μέγιστο μέγεθος: 5MB');
        return;
      }

      handleFileUpload(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        phone: phone.trim(),
        profilePicture: profilePicture
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Επεξεργασία Προφίλ
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Picture Section */}
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Upload Button Overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Μεταφόρτωση...' : 'Αλλαγή Φωτογραφίας'}
                </Button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Όνομα (από λογαριασμό)
                </label>
                <Input
                  value={user?.name || ''}
                  disabled
                  className="bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Το όνομα μπορεί να αλλάξει μόνο από τον διαχειριστή</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email (από λογαριασμό)
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Το email μπορεί να αλλάξει μόνο από τον διαχειριστή</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Τηλέφωνο *
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="π.χ. 6977123456"
                  className="focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Το τηλέφωνο χρησιμοποιείται για επικοινωνία από τον θεραπευτή</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-blue-200">
              <Button
                onClick={handleSave}
                disabled={saving || uploading || !phone.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Αποθήκευση...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Αποθήκευση Αλλαγών
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={saving || uploading}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Ακύρωση
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
