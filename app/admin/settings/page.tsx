"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useLogout } from '@/lib/auth-middleware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X,
  MessageSquare,
  AlertTriangle,
  Phone,
  MonitorSpeaker,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import TutorialCard from '@/components/admin/TutorialCard';

interface Banner {
  id: string;
  text: string;
  type: 'warning' | 'info' | 'contact';
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  icon: string;
  enabled: boolean;
  order?: number;
}

const BANNER_TYPES = {
  warning: {
    label: 'Προειδοποίηση',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    icon: 'AlertTriangle'
  },
  info: {
    label: 'Πληροφορία',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    icon: 'MessageSquare'
  },
  contact: {
    label: 'Επικοινωνία',
    bgColor: 'from-green-50 to-teal-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    icon: 'Phone'
  }
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const logout = useLogout();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    text: '',
    type: 'info',
    enabled: true
  });
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, router]);

  // Load banners
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBanners = async (updatedBanners: Banner[]) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updatedBanners })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Ρυθμίσεις αποθηκεύτηκαν επιτυχώς!');
        setTimeout(() => setSuccessMessage(''), 3000);
        await loadBanners(); // Reload to get latest data
      }
    } catch (error) {
      console.error('Error saving banners:', error);
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    if (!newBanner.text?.trim()) return;
    
    const bannerType = BANNER_TYPES[newBanner.type as keyof typeof BANNER_TYPES];
    const banner: Banner = {
      id: `banner-${Date.now()}`,
      text: newBanner.text.trim(),
      type: newBanner.type as 'warning' | 'info' | 'contact',
      enabled: newBanner.enabled || true,
      ...bannerType
    };
    
    const updatedBanners = [...banners, banner];
    setBanners(updatedBanners);
    saveBanners(updatedBanners);
    
    setNewBanner({ text: '', type: 'info', enabled: true });
    setShowAddBanner(false);
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    const updatedBanners = banners.map(banner => 
      banner.id === id ? { ...banner, ...updates } : banner
    );
    setBanners(updatedBanners);
  };

  const saveBannerChanges = (id: string) => {
    saveBanners(banners);
    setEditingBanner(null);
  };

  const deleteBanner = (id: string) => {
    const updatedBanners = banners.filter(banner => banner.id !== id);
    setBanners(updatedBanners);
    saveBanners(updatedBanners);
  };

  const toggleBannerEnabled = (id: string) => {
    const updatedBanners = banners.map(banner =>
      banner.id === id ? { ...banner, enabled: !banner.enabled } : banner
    );
    setBanners(updatedBanners);
    saveBanners(updatedBanners);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle': return AlertTriangle;
      case 'Phone': return Phone;
      case 'MessageSquare': return MessageSquare;
      default: return MessageSquare;
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Πίσω</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                  Ρυθμίσεις Διαχειριστή
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Διαχείριση μηνυμάτων banner και ρυθμίσεων συστήματος
                </p>
              </div>
            </div>
            
            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="hidden sm:block"
                >
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    {successMessage}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MonitorSpeaker className="w-5 h-5" />
                  Γρήγορες Ενέργειες
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  Προβολή ως Μαθητής
                </Button>
                
                <Button
                  onClick={() => router.push('/admin')}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Πίνακας Διαχείρισης
                </Button>
                
                <Separator />
                
                <Button
                  onClick={() => logout()}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Αποσύνδεση
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Banner Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Διαχείριση Μηνυμάτων Banner
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddBanner(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Προσθήκη</span>
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Τα μηνύματα αυτά εμφανίζονται στο dashboard των μαθητών
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Φόρτωση μηνυμάτων...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Add New Banner */}
                    <AnimatePresence>
                      {showAddBanner && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Card className="border-dashed border-2">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Κείμενο Μηνύματος
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({newBanner.text?.length || 0}/50 χαρακτήρες)
                                    </span>
                                  </label>
                                  <Textarea
                                    value={newBanner.text}
                                    onChange={(e) => setNewBanner({ ...newBanner, text: e.target.value })}
                                    placeholder="Εισάγετε το μήνυμα..."
                                    maxLength={50}
                                    rows={2}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Τύπος
                                  </label>
                                  <Select
                                    value={newBanner.type}
                                    onValueChange={(value) => setNewBanner({ ...newBanner, type: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(BANNER_TYPES).map(([key, type]) => (
                                        <SelectItem key={key} value={key}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={newBanner.enabled}
                                      onCheckedChange={(enabled) => setNewBanner({ ...newBanner, enabled })}
                                    />
                                    <span className="text-sm">Ενεργό</span>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => setShowAddBanner(false)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={addBanner}
                                      size="sm"
                                      disabled={!newBanner.text?.trim()}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Existing Banners */}
                    {banners.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Δεν υπάρχουν μηνύματα banner</p>
                        <p className="text-sm">Προσθέστε το πρώτο σας μήνυμα</p>
                      </div>
                    ) : (
                      banners.map((banner) => {
                        const IconComponent = getIcon(banner.icon);
                        const isEditing = editingBanner === banner.id;
                        
                        return (
                          <motion.div
                            key={banner.id}
                            layout
                            className={`border rounded-lg p-4 ${banner.enabled ? 'bg-white' : 'bg-gray-50 opacity-75'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${banner.bgColor} ${banner.borderColor} border`}>
                                <IconComponent className={`w-4 h-4 ${banner.iconColor}`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Textarea
                                        value={banner.text}
                                        onChange={(e) => updateBanner(banner.id, { text: e.target.value })}
                                        maxLength={50}
                                        rows={2}
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        {banner.text?.length || 0}/50 χαρακτήρες
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <Select
                                        value={banner.type}
                                        onValueChange={(value) => {
                                          const bannerType = BANNER_TYPES[value as keyof typeof BANNER_TYPES];
                                          updateBanner(banner.id, {
                                            type: value as any,
                                            ...bannerType
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(BANNER_TYPES).map(([key, type]) => (
                                            <SelectItem key={key} value={key}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : (
                                  <p className={`${banner.textColor} text-sm sm:text-base leading-relaxed`}>
                                    {banner.text}
                                  </p>
                                )}
                                
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {BANNER_TYPES[banner.type].label}
                                  </Badge>
                                  {banner.enabled ? (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      Ενεργό
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Ανενεργό
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => toggleBannerEnabled(banner.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-2"
                                >
                                  {banner.enabled ? 
                                    <EyeOff className="w-4 h-4" /> : 
                                    <Eye className="w-4 h-4" />
                                  }
                                </Button>
                                
                                {isEditing ? (
                                  <>
                                    <Button
                                      onClick={() => setEditingBanner(null)}
                                      variant="ghost"
                                      size="sm"
                                      className="p-2"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => saveBannerChanges(banner.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="p-2"
                                      disabled={saving}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    onClick={() => setEditingBanner(banner.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="p-2"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => deleteBanner(banner.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tutorial Card */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <TutorialCard
          title="Οδηγός Ρυθμίσεων Διαχειριστή"
          description="Μάθετε πώς να διαχειρίζεστε τα μηνύματα banner, τις ρυθμίσεις του συστήματος και την πλοήγηση."
          steps={[
            {
              title: "Προσθήκη Νέου Banner",
              description: "Κάντε κλικ στο κουμπί 'Προσθήκη' για να δημιουργήσετε νέο μήνυμα banner.",
              action: "Επιλέξτε τύπο (Προειδοποίηση, Πληροφορία, Επικοινωνία) και γράψτε το κείμενο"
            },
            {
              title: "Επεξεργασία Banner",
              description: "Κάντε κλικ στο εικονίδιο μολυβιού για να επεξεργαστείτε υπάρχον banner.",
              action: "Αλλάξτε το κείμενο ή τον τύπο και κάντε κλικ στο εικονίδιο αποθήκευσης"
            },
            {
              title: "Ενεργοποίηση/Απενεργοποίηση",
              description: "Χρησιμοποιήστε το εικονίδιο ματιού για να ενεργοποιήσετε ή απενεργοποιήσετε banners.",
              action: "Μόνο τα ενεργά banners εμφανίζονται στο dashboard των μαθητών"
            },
            {
              title: "Γρήγορες Ενέργειες",
              description: "Χρησιμοποιήστε τα κουμπιά στην αριστερή πλευρά για γρήγορη πρόσβαση σε λειτουργίες.",
              action: "Προβολή ως Μαθητής, Πίνακας Διαχείρισης, ή Αποσύνδεση"
            }
          ]}
        />
      </div>

      {/* Mobile Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="sm:hidden fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-green-100 text-green-800 border border-green-200 rounded-lg p-3 text-sm">
              {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
