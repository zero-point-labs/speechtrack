"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Trophy, Settings } from "lucide-react";
import { SessionSelector } from "./SessionSelector";
import { TrophyDesigner } from "./TrophyDesigner";

const STEP_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

const STEP_ICONS = [
  "🎯", "⭐", "🏆", "🚀", "💎", "👑", "🌟", "⚡",
  "🎪", "🎨", "🎵", "🏅", "🎊", "🎉", "🔥", "✨"
];

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  sessionIds: string[];
  requiredCompletionCount: number;
  hasTrophy: boolean;
  trophyData?: any;
  isCompleted: boolean;
  completedAt: string | null;
  unlockedAt: string | null;
}

interface Session {
  $id: string;
  title: string;
  date: string;
  status: string;
}

interface StepBuilderProps {
  step: Step;
  availableSessions: Session[];
  onUpdate: (updates: Partial<Step>) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function StepBuilder({ 
  step, 
  availableSessions, 
  onUpdate, 
  onDelete, 
  canDelete 
}: StepBuilderProps) {
  const [showTrophyDesigner, setShowTrophyDesigner] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);

  const handleSessionAssignment = (sessionIds: string[]) => {
    onUpdate({ 
      sessionIds,
      requiredCompletionCount: Math.min(step.requiredCompletionCount, sessionIds.length) || 1
    });
    setShowSessionSelector(false);
  };

  const handleTrophyToggle = (enabled: boolean) => {
    if (enabled) {
      onUpdate({
        hasTrophy: true,
        trophyData: {
          name: `Τρόπαιο ${step.title}`,
          icon: "🏆",
          category: "milestone",
          animation: "confetti",
          unlockMessage: `Συγχαρητήρια για την ολοκλήρωση του ${step.title}!`,
          backgroundColor: "#FFD700",
          glowColor: "#FFF",
          isEarned: false,
          earnedAt: null,
          isClaimed: false,
          claimedAt: null
        }
      });
    } else {
      onUpdate({ 
        hasTrophy: false, 
        trophyData: undefined 
      });
    }
  };

  const getSessionNames = () => {
    return step.sessionIds
      .map(id => {
        const session = availableSessions.find(s => s.$id === id);
        return session?.title || `Session ${id.slice(-4)}`;
      })
      .join(", ");
  };

  return (
    <>
      <Card className="border-l-4" style={{ borderLeftColor: step.color }}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: step.color, color: 'white' }}
              >
                {step.icon}
              </div>
              <div>
                <CardTitle className="text-lg">Βήμα {step.stepNumber}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {step.hasTrophy && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Trophy className="w-3 h-3 mr-1" />
                      Βήμα με Τρόπαιο
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {step.sessionIds.length} Συνεδρίες
                  </Badge>
                </div>
              </div>
            </div>
            
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Τίτλος Βήματος</label>
              <Input
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="π.χ., Θεμελιώδης Φάση"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Απαιτούμενες Ολοκληρώσεις</label>
              <Input
                type="number"
                min="1"
                max={step.sessionIds.length || 1}
                value={step.requiredCompletionCount}
                onChange={(e) => onUpdate({ requiredCompletionCount: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Περιγραφή</label>
            <Textarea
              value={step.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Σύντομη περιγραφή των στόχων αυτού του βήματος"
              rows={2}
            />
          </div>

          {/* Visual Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Εικονίδιο Βήματος</label>
              <div className="grid grid-cols-8 gap-2">
                {STEP_ICONS.map((icon) => (
                  <button
                    key={icon}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center hover:bg-gray-100 ${
                      step.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => onUpdate({ icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Χρώμα Βήματος</label>
              <div className="grid grid-cols-4 gap-2">
                {STEP_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      step.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdate({ color })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Session Assignment */}
          <div>
            <label className="block text-sm font-medium mb-2">Ανατεθείσες Συνεδρίες</label>
            <div className={`flex items-center justify-between p-3 border rounded-lg ${step.sessionIds.length === 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
              <div className="flex-1">
                {step.sessionIds.length > 0 ? (
                  <div>
                    <div className="text-sm font-medium">
                      {step.sessionIds.length} συνεδρία(ες) ανατέθηκαν
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {getSessionNames()}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-red-600 font-medium">
                      ⚠️ Δεν έχουν ανατεθεί συνεδρίες
                    </div>
                    <div className="text-xs text-red-500">
                      Το βήμα δεν θα μπορεί να ολοκληρωθεί χωρίς συνεδρίες
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionSelector(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Ανάθεση Συνεδριών
              </Button>
            </div>
          </div>

          {/* Trophy Configuration */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Ανταμοιβή Τροπαίου</label>
                <p className="text-xs text-gray-600">
                  Απονεμήστε ένα τρόπαιο όταν ολοκληρωθεί αυτό το βήμα
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={step.hasTrophy}
                  onChange={(e) => handleTrophyToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {step.hasTrophy && step.trophyData && (
              <div className="mt-2 p-3 border rounded-lg bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{step.trophyData.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{step.trophyData.name}</div>
                      <div className="text-xs text-gray-600">{step.trophyData.animation === 'confetti' ? 'κομφετί' : step.trophyData.animation === 'fireworks' ? 'πυροτεχνήματα' : step.trophyData.animation === 'sparkles' ? 'σπινθήρες' : 'λάμψη'}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTrophyDesigner(true)}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Προσαρμογή
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Selector Modal */}
      {showSessionSelector && (
        <SessionSelector
          availableSessions={availableSessions}
          selectedSessions={step.sessionIds}
          onSelectionChange={handleSessionAssignment}
          onClose={() => setShowSessionSelector(false)}
        />
      )}

      {/* Trophy Designer Modal */}
      {showTrophyDesigner && step.trophyData && (
        <TrophyDesigner
          currentTrophy={step.trophyData}
          stepTitle={step.title}
          onSave={(trophyData) => {
            onUpdate({ trophyData });
            setShowTrophyDesigner(false);
          }}
          onClose={() => setShowTrophyDesigner(false)}
        />
      )}
    </>
  );
}
