"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/lib/auth-middleware';
import { 
  Settings, 
  LogOut, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Phone,
  Home,
  X,
  MessageSquare,
  Palette,
  Globe
} from 'lucide-react';

// Greek language constants
const GREEK_TEXT = {
  settings: "Ρυθμίσεις Διαχείρισης",
  logout: "Αποσύνδεση",
  dashboard: "Πίνακας Ελέγχου",
  bannerManagement: "Διαχείριση Banners",
  currentBanners: "Ενεργά Banners",
  addBanner: "Προσθήκη Banner",
  bannerText: "Κείμενο Banner",
  bannerColor: "Χρώμα",
  bannerType: "Τύπος",
  save: "Αποθήκευση",
  cancel: "Ακύρωση",
  delete: "Διαγραφή",
  
  // Banner Types
  warning: "Προειδοποίηση",
  info: "Πληροφορία",
  contact: "Επικοινωνία",
  
  // Messages
  settingsSaved: "Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!",
  bannerAdded: "Το banner προστέθηκε επιτυχώς!",
  bannerDeleted: "Το banner διαγράφηκε επιτυχώς!",
  confirmLogout: "Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;",
  confirmDeleteBanner: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το banner;",
  
  // Placeholders
  bannerTextPlaceholder: "Εισάγετε το κείμενο του banner...",
  noBanners: "Δεν υπάρχουν ενεργά banners",
  
  // Navigation
  navigateToDashboard: "Πλοήγηση στον Πίνακα Ελέγχου",
  navigateToDashboardDesc: "Χρησιμοποιήστε την εφαρμογή ως μαθητής για εκπαίδευση"
};

interface Banner {
  id: string;
  text: string;
  type: 'warning' | 'info' | 'contact';
  bgColor: string;
  textColor: string;
  iconColor: string;
  borderColor: string;
  icon: string;
  enabled: boolean;
}

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState({
    text: '',
    type: 'warning' as const
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const logout = useLogout();

  // Load banners on mount
  useEffect(() => {
    if (isOpen) {
      loadBanners();
    }
  }, [isOpen]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const loadBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      // Load default banners if API fails
      setBanners([
        {
          id: 'default-1',
          text: 'Οι ακυρώσεις τελευταίας στιγμής χρεώνονται κανονικά',
          type: 'warning',
          bgColor: 'from-orange-50 to-red-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: 'AlertTriangle',
          enabled: true
        },
        {
          id: 'default-2',
          text: 'Για οποιαδήποτε βοήθεια καλέστε μας στο: 96684911',
          type: 'contact',
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: 'Phone',
          enabled: true
        }
      ]);
    }
  };

  const saveBanners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(GREEK_TEXT.settingsSaved);
      } else {
        throw new Error(data.error || 'Failed to save banners');
      }
    } catch (error) {
      console.error('Error saving banners:', error);
      setError('Σφάλμα αποθήκευσης ρυθμίσεων');
    } finally {
      setIsLoading(false);
    }
  };

  const addBanner = () => {
    if (!newBanner.text.trim()) return;
    
    const bannerConfig = {
      warning: {
        bgColor: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        icon: 'AlertTriangle'
      },
      info: {
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        icon: 'MessageSquare'
      },
      contact: {
        bgColor: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        icon: 'Phone'
      }
    };

    const config = bannerConfig[newBanner.type];
    const banner: Banner = {
      id: `banner-${Date.now()}`,
      text: newBanner.text.trim(),
      type: newBanner.type,
      enabled: true,
      ...config
    };

    setBanners(prev => [...prev, banner]);
    setNewBanner({ text: '', type: 'warning' });
    setSuccess(GREEK_TEXT.bannerAdded);
  };

  const deleteBanner = (id: string) => {
    if (window.confirm(GREEK_TEXT.confirmDeleteBanner)) {
      setBanners(prev => prev.filter(b => b.id !== id));
      setSuccess(GREEK_TEXT.bannerDeleted);
    }
  };

  const toggleBanner = (id: string) => {
    setBanners(prev => 
      prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b)
    );
  };

  const handleLogout = () => {
    if (window.confirm(GREEK_TEXT.confirmLogout)) {
      logout();
    }
  };

  const navigateToDashboard = () => {
    router.push('/dashboard');
    onClose();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle': return AlertTriangle;
      case 'Phone': return Phone;
      case 'MessageSquare': return MessageSquare;
      default: return MessageSquare;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                <h2 className="text-xl sm:text-2xl font-bold">{GREEK_TEXT.settings}</h2>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-4 sm:p-6 space-y-6">
              
              {/* Messages */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
                >
                  {success}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
                >
                  {error}
                </motion.div>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Γρήγορες Ενέργειες
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={navigateToDashboard}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 justify-start h-12"
                    >
                      <Home className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{GREEK_TEXT.navigateToDashboard}</div>
                        <div className="text-xs opacity-90">{GREEK_TEXT.navigateToDashboardDesc}</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 justify-start h-12"
                    >
                      <LogOut className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{GREEK_TEXT.logout}</div>
                        <div className="text-xs opacity-75">Αποσύνδεση από το σύστημα</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Banner Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {GREEK_TEXT.bannerManagement}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Current Banners */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{GREEK_TEXT.currentBanners}</h4>
                    {banners.length === 0 ? (
                      <p className="text-gray-500 text-sm">{GREEK_TEXT.noBanners}</p>
                    ) : (
                      <div className="space-y-2">
                        {banners.map(banner => {
                          const IconComponent = getIcon(banner.icon);
                          return (
                            <div
                              key={banner.id}
                              className={`p-3 rounded-lg border bg-gradient-to-r ${banner.bgColor} ${banner.borderColor} flex items-center justify-between gap-3`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <IconComponent className={`w-4 h-4 ${banner.iconColor} flex-shrink-0`} />
                                <span className={`${banner.textColor} text-sm flex-1 truncate`}>
                                  {banner.text}
                                </span>
                                <Badge variant={banner.enabled ? "default" : "secondary"} className="flex-shrink-0">
                                  {banner.enabled ? "Ενεργό" : "Ανενεργό"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  onClick={() => toggleBanner(banner.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <Palette className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => deleteBanner(banner.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add New Banner */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">{GREEK_TEXT.addBanner}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <Textarea
                          placeholder={GREEK_TEXT.bannerTextPlaceholder}
                          value={newBanner.text}
                          onChange={(e) => setNewBanner(prev => ({ ...prev, text: e.target.value }))}
                          className="h-20"
                        />
                      </div>
                      <div>
                        <select
                          value={newBanner.type}
                          onChange={(e) => setNewBanner(prev => ({ ...prev, type: e.target.value as 'warning' | 'info' | 'contact' }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="warning">{GREEK_TEXT.warning}</option>
                          <option value="info">{GREEK_TEXT.info}</option>
                          <option value="contact">{GREEK_TEXT.contact}</option>
                        </select>
                      </div>
                      <div>
                        <Button
                          onClick={addBanner}
                          disabled={!newBanner.text.trim()}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {GREEK_TEXT.addBanner}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="sm:w-auto"
              >
                {GREEK_TEXT.cancel}
              </Button>
              <Button
                onClick={saveBanners}
                disabled={isLoading}
                className="sm:w-auto"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {GREEK_TEXT.save}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
