"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  User,
  Calendar,
  Clock
} from "lucide-react";

// Session template interface
interface SessionTemplate {
  dayOfWeek: string;
  time: string;
  duration: number; // in minutes
}

// Form data interface
interface StudentFormData {
  name: string;
  age: number;
  sessionSetup: {
    totalWeeks: number;
    sessionsPerWeek: number;
    sessionTemplates: SessionTemplate[];
  };
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Δευτέρα' },
  { value: 'tuesday', label: 'Τρίτη' },
  { value: 'wednesday', label: 'Τετάρτη' },
  { value: 'thursday', label: 'Πέμπτη' },
  { value: 'friday', label: 'Παρασκευή' },
  { value: 'saturday', label: 'Σάββατο' },
  { value: 'sunday', label: 'Κυριακή' }
];

const DURATION_OPTIONS = [30, 45, 60, 90];

export default function CreateStudentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    age: 5,
    sessionSetup: {
      totalWeeks: 12,
      sessionsPerWeek: 1,
      sessionTemplates: [{
        dayOfWeek: 'monday',
        time: '10:00',
        duration: 45
      }]
    }
  });

  // Handle basic info changes
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleAgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const age = parseInt(e.target.value) || 5;
    setFormData(prev => ({ ...prev, age }));
  }, []);

  // Handle session setup changes
  const handleWeeksChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const weeks = parseInt(e.target.value) || 12;
    setFormData(prev => ({ 
      ...prev, 
      sessionSetup: { ...prev.sessionSetup, totalWeeks: weeks }
    }));
  }, []);

  const handleSessionsPerWeekChange = useCallback((sessions: number) => {
    setFormData(prev => {
      const currentTemplates = prev.sessionSetup.sessionTemplates;
      let newTemplates: SessionTemplate[];

      if (sessions > currentTemplates.length) {
        // Add new templates
        newTemplates = [...currentTemplates];
        for (let i = currentTemplates.length; i < sessions; i++) {
          newTemplates.push({
            dayOfWeek: 'monday',
            time: '10:00',
            duration: 45
          });
        }
      } else {
        // Remove excess templates
        newTemplates = currentTemplates.slice(0, sessions);
      }

      return {
        ...prev,
        sessionSetup: {
          ...prev.sessionSetup,
          sessionsPerWeek: sessions,
          sessionTemplates: newTemplates
        }
      };
    });
  }, []);

  // Handle individual session template changes
  const handleTemplateChange = useCallback((index: number, field: keyof SessionTemplate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sessionSetup: {
        ...prev.sessionSetup,
        sessionTemplates: prev.sessionSetup.sessionTemplates.map((template, i) => 
          i === index ? { ...template, [field]: value } : template
        )
      }
    }));
  }, []);

  // Handle form submission
  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      alert('Παρακαλώ εισάγετε το όνομα του μαθητή');
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Creating student with data:', formData);
    
    setIsSaving(false);
    router.push('/admin');
  }, [formData, router]);

  const handleCancel = useCallback(() => {
    router.push('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Νέος Μαθητής</h1>
              <p className="text-sm text-gray-500">Δημιουργία νέου μαθητή</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Αποθήκευση</span>
                <span className="sm:hidden">Αποθήκευση</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 overflow-x-hidden">
        
        {/* Basic Information Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-600" />
                Βασικά Στοιχεία
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Όνομα Μαθητή *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Εισάγετε το όνομα του μαθητή"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ηλικία *
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="18"
                    value={formData.age}
                    onChange={handleAgeChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Setup Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-purple-600" />
                Ρύθμιση Συνεδριών
              </h2>

              {/* Total Weeks and Sessions Per Week */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Συνολικές Εβδομάδες *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.sessionSetup.totalWeeks}
                    onChange={handleWeeksChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Συνολικό πρόγραμμα: {formData.sessionSetup.totalWeeks * formData.sessionSetup.sessionsPerWeek} συνεδρίες
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Συνεδρίες ανά Εβδομάδα *
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((num) => (
                      <Button
                        key={num}
                        variant={formData.sessionSetup.sessionsPerWeek === num ? "default" : "outline"}
                        onClick={() => handleSessionsPerWeekChange(num)}
                        className={`flex-1 ${
                          formData.sessionSetup.sessionsPerWeek === num 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {num} {num === 1 ? 'φορά' : 'φορές'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Templates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Πρόγραμμα Συνεδριών
                  </h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800">
                    {formData.sessionSetup.sessionsPerWeek} {formData.sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} / εβδομάδα
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.sessionSetup.sessionTemplates.map((template, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Συνεδρία {index + 1}
                        </h4>
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Day of Week */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ημέρα
                          </label>
                          <select
                            value={template.dayOfWeek}
                            onChange={(e) => handleTemplateChange(index, 'dayOfWeek', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ώρα
                          </label>
                          <Input
                            type="time"
                            value={template.time}
                            onChange={(e) => handleTemplateChange(index, 'time', e.target.value)}
                            className="w-full"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Διάρκεια (λεπτά)
                          </label>
                          <select
                            value={template.duration}
                            onChange={(e) => handleTemplateChange(index, 'duration', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {DURATION_OPTIONS.map((duration) => (
                              <option key={duration} value={duration}>
                                {duration} λεπτά
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Σύνοψη Προγράμματος</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• {formData.sessionSetup.totalWeeks} εβδομάδες προγράμματος</p>
                  <p>• {formData.sessionSetup.sessionsPerWeek} {formData.sessionSetup.sessionsPerWeek === 1 ? 'συνεδρία' : 'συνεδρίες'} ανά εβδομάδα</p>
                  <p>• Συνολικά {formData.sessionSetup.totalWeeks * formData.sessionSetup.sessionsPerWeek} συνεδρίες</p>
                  <p>• Διάρκεια κάθε συνεδρίας: {formData.sessionSetup.sessionTemplates[0]?.duration || 45} λεπτά</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
