"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, FileText } from "lucide-react";

interface ChildFormData {
  name: string;
  dateOfBirth: string;
  age: number;
  goals: string;
  medicalHistory: string;
  additionalNotes: string;
}

interface ChildProfileFormProps {
  initialData?: Partial<ChildFormData>;
  onSubmit: (data: ChildFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

export default function ChildProfileForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Αποθήκευση",
  loading = false,
  className = ""
}: ChildProfileFormProps) {
  const [formData, setFormData] = useState<ChildFormData>({
    name: "",
    dateOfBirth: "",
    age: 0,
    goals: "",
    medicalHistory: "",
    additionalNotes: "",
    ...initialData
  });
  const [errors, setErrors] = useState<Partial<ChildFormData>>({});

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setFormData(prev => ({ ...prev, age: age - 1 }));
      } else {
        setFormData(prev => ({ ...prev, age }));
      }
    }
  }, [formData.dateOfBirth]);

  const handleInputChange = (field: keyof ChildFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ChildFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Το όνομα είναι υποχρεωτικό";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Η ημερομηνία γέννησης είναι υποχρεωτική";
    } else if (formData.age < 2 || formData.age > 18) {
      newErrors.dateOfBirth = "Η ηλικία πρέπει να είναι μεταξύ 2 και 18 ετών";
    }

    if (!formData.goals.trim()) {
      newErrors.goals = "Οι στόχοι θεραπείας είναι υποχρεωτικοί";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Στοιχεία Παιδιού</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Βασικά Στοιχεία
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Όνομα Παιδιού *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Εισάγετε το όνομα του παιδιού"
                  className={`h-12 ${errors.name ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                  Ημερομηνία Γέννησης *
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className={`h-12 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
                {formData.age > 0 && (
                  <p className="text-sm text-blue-600">
                    Ηλικία: {formData.age} {formData.age === 1 ? 'έτος' : 'έτη'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Therapy Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Πληροφορίες Θεραπείας
            </h3>
            
            <div className="space-y-2">
              <label htmlFor="goals" className="text-sm font-medium text-gray-700">
                Στόχοι Θεραπείας *
              </label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => handleInputChange("goals", e.target.value)}
                placeholder="Περιγράψτε τους στόχους που θέλετε να επιτύχει το παιδί μέσω της λογοθεραπείας..."
                className={`min-h-24 ${errors.goals ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.goals && (
                <p className="text-sm text-red-600">{errors.goals}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="medicalHistory" className="text-sm font-medium text-gray-700">
                Ιατρικό Ιστορικό (προαιρετικό)
              </label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                placeholder="Αναφέρετε τυχόν ιατρικές καταστάσεις, διαγνώσεις, ή άλλα σχετικά στοιχεία..."
                className="min-h-20"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="additionalNotes" className="text-sm font-medium text-gray-700">
                Πρόσθετες Σημειώσεις (προαιρετικό)
              </label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                placeholder="Οτιδήποτε άλλο θα θέλατε να γνωρίζει ο θεραπευτής..."
                className="min-h-20"
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Ακύρωση
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Επεξεργασία...</span>
                </div>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
