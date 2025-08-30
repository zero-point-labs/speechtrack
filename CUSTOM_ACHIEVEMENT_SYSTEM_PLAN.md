# 🎯 Custom Achievement System Implementation Plan

## Project Context & Overview

**Project:** SpeechTrack - Speech Therapy Management Platform  
**Framework:** Next.js 15.5.0 with TypeScript  
**Backend:** Appwrite (Cloud)  
**Current Progress Component:** `components/HeroStepsProgress.tsx` - Linear session-based hero progression  
**Target:** Replace/enhance with fully customizable achievement system where therapists design reward journeys independent of session order

### Current System State
- ✅ Working dashboard with hero progress toggle (`app/dashboard/page.tsx`)
- ✅ Basic hero character evolution (4 levels based on session completion)
- ✅ Session-based progression (circles for each session)
- ✅ Appwrite integration with existing collections (students, sessions, etc.)
- ✅ Admin interface for student/session management

### Goal System Requirements
The new achievement system must:
1. Allow therapists to create custom milestone journeys (3-120+ sessions)
2. Enable flexible session-to-step mapping (any sessions can belong to any step)
3. Support trophy rewards with unlock animations
4. Maintain hero character evolution tied to achievement progress
5. Provide both admin configuration interface and student-facing progress display

---

## Database Architecture

### New Appwrite Collections

#### Collection: `achievement_journeys`
```javascript
{
  $id: "677abc123...", // Auto-generated
  studentId: "677def456...", // Reference to students collection
  journeyName: "Emma's Speech Adventure",
  description: "Custom journey for pronunciation and vocabulary goals",
  isActive: true,
  createdBy: "677therapist789...", // Reference to admin user
  templateId: null, // Optional reference to journey_templates
  
  // Journey configuration
  totalSteps: 6,
  stepConfiguration: [
    {
      stepNumber: 1,
      title: "Foundation Phase",
      description: "Building basic pronunciation skills",
      icon: "🎯", // Emoji or predefined icon key
      color: "#3B82F6", // Hex color for step theme
      
      // Session assignment
      sessionIds: ["session1_id", "session2_id", "session3_id"],
      requiredCompletionCount: 3, // All sessions or partial completion
      
      // Trophy configuration
      hasTrophy: false,
      
      // Progress tracking
      isCompleted: false,
      completedAt: null,
      unlockedAt: "2024-01-01T10:00:00Z" // When step became available
    },
    {
      stepNumber: 2,
      title: "Building Confidence",
      description: "Expanding vocabulary through practice",
      icon: "⭐",
      color: "#10B981",
      sessionIds: ["session4_id", "session5_id"],
      requiredCompletionCount: 2,
      hasTrophy: false,
      isCompleted: true,
      completedAt: "2024-01-10T15:30:00Z",
      unlockedAt: "2024-01-05T10:00:00Z"
    },
    {
      stepNumber: 3,
      title: "First Milestone",
      description: "Major breakthrough in pronunciation accuracy",
      icon: "🏆",
      color: "#F59E0B",
      sessionIds: ["session6_id", "session7_id", "session8_id"],
      requiredCompletionCount: 3,
      
      // Trophy data
      hasTrophy: true,
      trophyData: {
        name: "Bronze Speech Champion",
        icon: "🥉",
        category: "milestone", // milestone, skill, completion, special
        animation: "confetti", // confetti, sparkles, fireworks, glow
        unlockMessage: "Amazing progress! You're becoming a speech champion!",
        backgroundColor: "#CD7F32",
        glowColor: "#FFD700",
        
        // Trophy state
        isEarned: true,
        earnedAt: "2024-01-15T11:00:00Z",
        isClaimed: false, // User must click to claim
        claimedAt: null
      },
      
      isCompleted: true,
      completedAt: "2024-01-15T10:30:00Z",
      unlockedAt: "2024-01-12T10:00:00Z"
    },
    {
      stepNumber: 4,
      title: "Advanced Practice",
      description: "Complex sentence structures and fluency",
      icon: "🚀",
      color: "#8B5CF6",
      sessionIds: ["session9_id", "session10_id", "session11_id", "session12_id"],
      requiredCompletionCount: 4,
      hasTrophy: false,
      isCompleted: false,
      completedAt: null,
      unlockedAt: "2024-01-15T11:00:00Z" // Unlocked when step 3 completed
    },
    {
      stepNumber: 5,
      title: "Mastery Challenge",
      description: "Demonstrating consistent fluency",
      icon: "💎",
      color: "#EC4899",
      sessionIds: ["session13_id", "session14_id"],
      requiredCompletionCount: 2,
      hasTrophy: false,
      isCompleted: false,
      completedAt: null,
      unlockedAt: null // Will unlock when step 4 completes
    },
    {
      stepNumber: 6,
      title: "Speech Master",
      description: "Ultimate achievement in speech therapy",
      icon: "👑",
      color: "#DC2626",
      sessionIds: ["session15_id"],
      requiredCompletionCount: 1,
      
      hasTrophy: true,
      trophyData: {
        name: "Golden Speech Master",
        icon: "🏆",
        category: "completion",
        animation: "fireworks",
        unlockMessage: "Congratulations! You are now a Speech Master!",
        backgroundColor: "#FFD700",
        glowColor: "#FFF",
        isEarned: false,
        earnedAt: null,
        isClaimed: false,
        claimedAt: null
      },
      
      isCompleted: false,
      completedAt: null,
      unlockedAt: null
    }
  ],
  
  // Journey metadata
  $createdAt: "2024-01-01T00:00:00Z",
  $updatedAt: "2024-01-15T11:00:00Z"
}
```

#### Collection: `journey_templates` (Optional - for predefined templates)
```javascript
{
  $id: "template_id",
  name: "Pronunciation Focus Journey",
  description: "6-step journey designed for pronunciation improvement",
  category: "pronunciation", // pronunciation, vocabulary, fluency, general
  ageGroup: "4-8", // Target age range
  sessionCount: 15, // Recommended session count
  
  templateSteps: [
    {
      stepNumber: 1,
      title: "Sound Recognition",
      description: "Learning to identify target sounds",
      icon: "👂",
      color: "#3B82F6",
      recommendedSessions: 3,
      hasTrophy: false
    },
    // ... more template steps
  ],
  
  createdBy: "therapist_id",
  isPublic: true, // Can be used by other therapists
  usageCount: 25, // How many times this template has been used
  rating: 4.5, // Average rating from therapists
  
  $createdAt: "2024-01-01T00:00:00Z"
}
```

#### Collection: `trophy_library` (Predefined trophy options)
```javascript
{
  $id: "trophy_id",
  name: "Bronze Champion",
  icon: "🥉",
  category: "milestone",
  description: "First major milestone achievement",
  
  // Visual properties
  backgroundColor: "#CD7F32",
  glowColor: "#FFD700",
  particleColor: "#FFA500",
  
  // Animation options
  availableAnimations: ["confetti", "sparkles", "glow"],
  defaultAnimation: "confetti",
  
  // Default messages
  defaultUnlockMessage: "Great job reaching this milestone!",
  celebrationSound: "trophy_fanfare.mp3", // Optional
  
  // Metadata
  difficulty: "easy", // easy, medium, hard, expert
  rarity: "common", // common, rare, epic, legendary
  
  $createdAt: "2024-01-01T00:00:00Z"
}
```

---

## Backend Services & API Layer

### File: `lib/achievementService.js`

```javascript
import { databases, Query } from '@/lib/appwrite.client';
import { appwriteConfig } from '@/lib/appwrite.config';

export class AchievementService {
  
  // Journey Management
  async getJourneyForStudent(studentId) {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        [
          Query.equal('studentId', studentId),
          Query.equal('isActive', true)
        ]
      );
      return response.documents[0] || null;
    } catch (error) {
      console.error('Error fetching journey:', error);
      return null;
    }
  }
  
  async createJourney(studentId, journeyData) {
    try {
      const journey = {
        studentId,
        ...journeyData,
        isActive: true,
        $createdAt: new Date().toISOString()
      };
      
      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        'unique()',
        journey
      );
      
      return response;
    } catch (error) {
      console.error('Error creating journey:', error);
      throw error;
    }
  }
  
  async updateJourneyStep(journeyId, stepNumber, updateData) {
    try {
      // Get current journey
      const journey = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId
      );
      
      // Update specific step
      const updatedSteps = journey.stepConfiguration.map(step => {
        if (step.stepNumber === stepNumber) {
          return { ...step, ...updateData };
        }
        return step;
      });
      
      // Update journey
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId,
        {
          stepConfiguration: updatedSteps,
          $updatedAt: new Date().toISOString()
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error updating journey step:', error);
      throw error;
    }
  }
  
  // Progress Calculation
  async calculateStepProgress(step, completedSessions) {
    const completedInStep = step.sessionIds.filter(sessionId => 
      completedSessions.includes(sessionId)
    ).length;
    
    const progressPercentage = (completedInStep / step.requiredCompletionCount) * 100;
    const isStepCompleted = completedInStep >= step.requiredCompletionCount;
    
    return {
      completedSessions: completedInStep,
      totalSessions: step.sessionIds.length,
      requiredSessions: step.requiredCompletionCount,
      progressPercentage: Math.min(progressPercentage, 100),
      isCompleted: isStepCompleted,
      canClaim: isStepCompleted && step.hasTrophy && step.trophyData && !step.trophyData.isClaimed
    };
  }
  
  async getCompletedSessions(studentId) {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.equal('status', 'completed')
        ]
      );
      
      return response.documents.map(session => session.$id);
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }
  }
  
  // Trophy Management
  async claimTrophy(journeyId, stepNumber) {
    try {
      const claimTime = new Date().toISOString();
      
      await this.updateJourneyStep(journeyId, stepNumber, {
        'trophyData.isClaimed': true,
        'trophyData.claimedAt': claimTime
      });
      
      // Optionally unlock next step
      await this.unlockNextStep(journeyId, stepNumber);
      
      return { success: true, claimedAt: claimTime };
    } catch (error) {
      console.error('Error claiming trophy:', error);
      throw error;
    }
  }
  
  async unlockNextStep(journeyId, completedStepNumber) {
    const nextStepNumber = completedStepNumber + 1;
    
    try {
      await this.updateJourneyStep(journeyId, nextStepNumber, {
        unlockedAt: new Date().toISOString()
      });
    } catch (error) {
      // Next step might not exist, which is fine
      console.log(`No step ${nextStepNumber} to unlock`);
    }
  }
  
  // Template Management
  async getJourneyTemplates(category = null, ageGroup = null) {
    try {
      const queries = [Query.equal('isPublic', true)];
      
      if (category) {
        queries.push(Query.equal('category', category));
      }
      
      if (ageGroup) {
        queries.push(Query.equal('ageGroup', ageGroup));
      }
      
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.journeyTemplates,
        queries
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }
  
  async getTrophyLibrary() {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.trophyLibrary
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching trophy library:', error);
      return [];
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService();
```

---

## Frontend Components Architecture

### 1. Student-Facing Components

#### File: `components/CustomAchievementJourney.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { achievementService } from "@/lib/achievementService";
import { TrophyRevealModal } from "./TrophyRevealModal";
import { HeroCharacter } from "./HeroCharacter";

interface AchievementStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  sessionIds: string[];
  requiredCompletionCount: number;
  hasTrophy: boolean;
  trophyData?: TrophyData;
  isCompleted: boolean;
  completedAt: string | null;
  unlockedAt: string | null;
}

interface TrophyData {
  name: string;
  icon: string;
  category: string;
  animation: string;
  unlockMessage: string;
  backgroundColor: string;
  glowColor: string;
  isEarned: boolean;
  earnedAt: string | null;
  isClaimed: boolean;
  claimedAt: string | null;
}

interface AchievementJourney {
  $id: string;
  studentId: string;
  journeyName: string;
  description: string;
  totalSteps: number;
  stepConfiguration: AchievementStep[];
}

interface CustomAchievementJourneyProps {
  studentId: string;
  studentName?: string;
  onStepClick?: (step: AchievementStep) => void;
  showParentInfo?: boolean;
}

export default function CustomAchievementJourney({
  studentId,
  studentName = "Hero",
  onStepClick,
  showParentInfo = false
}: CustomAchievementJourneyProps) {
  const [journey, setJourney] = useState<AchievementJourney | null>(null);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [stepProgress, setStepProgress] = useState<{[key: number]: any}>({});
  const [loading, setLoading] = useState(true);
  const [trophyToReveal, setTrophyToReveal] = useState<{step: AchievementStep, trophy: TrophyData} | null>(null);

  useEffect(() => {
    loadJourneyData();
  }, [studentId]);

  const loadJourneyData = async () => {
    try {
      setLoading(true);
      
      // Load journey and completed sessions in parallel
      const [journeyData, completedSessionIds] = await Promise.all([
        achievementService.getJourneyForStudent(studentId),
        achievementService.getCompletedSessions(studentId)
      ]);
      
      if (journeyData) {
        setJourney(journeyData);
        setCompletedSessions(completedSessionIds);
        
        // Calculate progress for each step
        const progressData: {[key: number]: any} = {};
        for (const step of journeyData.stepConfiguration) {
          progressData[step.stepNumber] = await achievementService.calculateStepProgress(
            step, 
            completedSessionIds
          );
        }
        setStepProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrophyClaim = async (step: AchievementStep) => {
    if (!journey || !step.trophyData) return;
    
    try {
      await achievementService.claimTrophy(journey.$id, step.stepNumber);
      
      // Show trophy reveal modal
      setTrophyToReveal({ step, trophy: step.trophyData });
      
      // Reload journey data to reflect changes
      await loadJourneyData();
    } catch (error) {
      console.error('Error claiming trophy:', error);
    }
  };

  const calculateHeroLevel = () => {
    if (!journey) return 1;
    
    const completedSteps = journey.stepConfiguration.filter(step => step.isCompleted).length;
    const totalSteps = journey.totalSteps;
    const progressPercent = (completedSteps / totalSteps) * 100;
    
    if (progressPercent < 25) return 1; // Basic hero
    if (progressPercent < 50) return 2; // Cape hero
    if (progressPercent < 75) return 3; // Star hero
    return 4; // Champion hero
  };

  const getStepState = (step: AchievementStep, progress: any) => {
    if (!step.unlockedAt) return 'locked';
    if (!progress?.isCompleted) return 'available';
    if (step.hasTrophy && step.trophyData && !step.trophyData.isClaimed) return 'claimable';
    return 'completed';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 rounded-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!journey) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Achievement Journey Found
          </h3>
          <p className="text-gray-500">
            Ask your therapist to create a custom achievement journey for you!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {journey.journeyName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {journey.description}
            </p>
            
            {/* Hero Character */}
            <div className="flex justify-center mb-4">
              <HeroCharacter 
                level={calculateHeroLevel()}
                studentName={studentName}
                isAnimated={true}
              />
            </div>
          </div>

          {/* Steps Progress Path */}
          <div className="relative mb-6">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2 rounded-full" />
            
            {/* Steps Container */}
            <div className="relative flex justify-between items-center py-4 overflow-x-auto scrollbar-hide">
              {journey.stepConfiguration.map((step, index) => {
                const progress = stepProgress[step.stepNumber] || {};
                const state = getStepState(step, progress);
                
                return (
                  <div key={step.stepNumber} className="flex-shrink-0 relative">
                    {/* Connection Line */}
                    {index > 0 && (
                      <div
                        className={`absolute top-1/2 right-1/2 w-full h-1 -translate-y-1/2 transition-colors ${
                          journey.stepConfiguration[index - 1].isCompleted 
                            ? 'bg-gradient-to-r from-green-400 to-blue-400' 
                            : 'bg-gray-300'
                        }`}
                        style={{ width: "calc(100% + 2rem)" }}
                      />
                    )}

                    {/* Step Circle */}
                    <motion.div
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer transition-all z-10 ${
                        state === 'locked' && 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: step.color }}
                      whileHover={state !== 'locked' ? { scale: 1.05 } : {}}
                      whileTap={state !== 'locked' ? { scale: 0.95 } : {}}
                      onClick={() => state !== 'locked' && onStepClick?.(step)}
                    >
                      {/* Step Content */}
                      {state === 'locked' && (
                        <div className="text-2xl">🔒</div>
                      )}
                      
                      {state === 'available' && (
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl mb-1">{step.icon}</div>
                          <div className="text-xs text-white font-bold">
                            {progress.completedSessions}/{progress.requiredSessions}
                          </div>
                        </div>
                      )}
                      
                      {state === 'claimable' && (
                        <motion.div 
                          className="text-2xl sm:text-3xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ❓
                        </motion.div>
                      )}
                      
                      {state === 'completed' && (
                        <div className="text-center">
                          {step.hasTrophy && step.trophyData ? (
                            <div className="text-2xl sm:text-3xl">{step.trophyData.icon}</div>
                          ) : (
                            <div className="text-2xl sm:text-3xl text-white">✅</div>
                          )}
                        </div>
                      )}

                      {/* Progress Ring */}
                      {state === 'available' && progress.progressPercentage > 0 && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="30%"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="30%"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 24}`}
                            strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress.progressPercentage / 100)}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                      )}
                    </motion.div>

                    {/* Step Label */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center min-w-max">
                      <div className="text-xs font-medium text-gray-700">
                        {step.title}
                      </div>
                    </div>

                    {/* Trophy Claim Button */}
                    {state === 'claimable' && (
                      <motion.div
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold shadow-lg"
                          onClick={() => handleTrophyClaim(step)}
                        >
                          🏆 Claim Trophy!
                        </Button>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Journey Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
              <div className="text-lg font-bold text-green-600">
                {journey.stepConfiguration.filter(s => s.isCompleted).length}
              </div>
              <div className="text-xs text-green-700">Completed Steps</div>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
              <div className="text-lg font-bold text-blue-600">
                {journey.stepConfiguration.filter(s => s.hasTrophy && s.trophyData?.isClaimed).length}
              </div>
              <div className="text-xs text-blue-700">Trophies Earned</div>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
              <div className="text-lg font-bold text-purple-600">
                {Math.round((journey.stepConfiguration.filter(s => s.isCompleted).length / journey.totalSteps) * 100)}%
              </div>
              <div className="text-xs text-purple-700">Journey Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trophy Reveal Modal */}
      <AnimatePresence>
        {trophyToReveal && (
          <TrophyRevealModal
            step={trophyToReveal.step}
            trophy={trophyToReveal.trophy}
            onClose={() => setTrophyToreveal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

#### File: `components/TrophyRevealModal.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from 'canvas-confetti';

interface TrophyRevealModalProps {
  step: AchievementStep;
  trophy: TrophyData;
  onClose: () => void;
}

export function TrophyRevealModal({ step, trophy, onClose }: TrophyRevealModalProps) {
  const [showTrophy, setShowTrophy] = useState(false);

  useEffect(() => {
    // Trigger trophy reveal after modal opens
    const timer = setTimeout(() => {
      setShowTrophy(true);
      triggerAnimation(trophy.animation);
    }, 500);

    return () => clearTimeout(timer);
  }, [trophy.animation]);

  const triggerAnimation = (animationType: string) => {
    switch (animationType) {
      case 'confetti':
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#87CEEB']
        });
        break;
        
      case 'fireworks':
        const count = 200;
        const defaults = {
          origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
        break;

      case 'sparkles':
        // Custom sparkle effect using CSS animations
        const sparkles = document.querySelectorAll('.sparkle-effect');
        sparkles.forEach((sparkle, index) => {
          setTimeout(() => {
            sparkle.classList.add('animate-sparkle');
          }, index * 100);
        });
        break;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(135deg, ${trophy.backgroundColor}20, ${trophy.glowColor}20)`
        }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="sparkle-effect absolute w-2 h-2 bg-yellow-300 rounded-full opacity-0"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Trophy Icon */}
        <motion.div
          className="text-8xl mb-4 relative z-10"
          initial={{ scale: 0, rotateY: 180 }}
          animate={showTrophy ? { scale: 1, rotateY: 0 } : {}}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
        >
          {showTrophy ? trophy.icon : "❓"}
        </motion.div>

        {/* Trophy Name */}
        <motion.h2
          className="text-2xl font-bold text-gray-800 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {trophy.name}
        </motion.h2>

        {/* Step Title */}
        <motion.p
          className="text-lg text-gray-600 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {step.title} Complete!
        </motion.p>

        {/* Unlock Message */}
        <motion.p
          className="text-base text-gray-700 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {trophy.unlockMessage}
        </motion.p>

        {/* Close Button */}
        <motion.button
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          onClick={onClose}
        >
          Awesome! 🎉
        </motion.button>
      </motion.div>

      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}
```

### 2. Admin Components

#### File: `app/admin/students/[studentId]/achievement-builder/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminRoute } from "@/lib/auth-middleware";
import { achievementService } from "@/lib/achievementService";
import { Plus, Trash2, Trophy, Edit, Save, Eye } from "lucide-react";
import { StepBuilder } from "@/components/admin/StepBuilder";
import { SessionSelector } from "@/components/admin/SessionSelector";
import { TrophyDesigner } from "@/components/admin/TrophyDesigner";
import { JourneyPreview } from "@/components/admin/JourneyPreview";

export default function AchievementBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [journey, setJourney] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Journey configuration state
  const [journeyName, setJourneyName] = useState("");
  const [journeyDescription, setJourneyDescription] = useState("");
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      // Load student, sessions, and existing journey
      const [studentData, sessionsData, journeyData] = await Promise.all([
        databases.getDocument(appwriteConfig.databaseId, appwriteConfig.collections.students, studentId),
        databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.collections.sessions, [
          Query.equal('studentId', studentId)
        ]),
        achievementService.getJourneyForStudent(studentId)
      ]);

      setStudent(studentData);
      setSessions(sessionsData.documents);
      
      if (journeyData) {
        setJourney(journeyData);
        setJourneyName(journeyData.journeyName);
        setJourneyDescription(journeyData.description);
        setSteps(journeyData.stepConfiguration);
        setIsEditing(true);
      } else {
        // Initialize with default first step
        setSteps([createDefaultStep(1)]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createDefaultStep = (stepNumber) => ({
    stepNumber,
    title: `Step ${stepNumber}`,
    description: "",
    icon: "🎯",
    color: "#3B82F6",
    sessionIds: [],
    requiredCompletionCount: 1,
    hasTrophy: false,
    isCompleted: false,
    completedAt: null,
    unlockedAt: stepNumber === 1 ? new Date().toISOString() : null
  });

  const addStep = () => {
    const newStep = createDefaultStep(steps.length + 1);
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepNumber) => {
    setSteps(steps.filter(step => step.stepNumber !== stepNumber)
      .map((step, index) => ({ ...step, stepNumber: index + 1 })));
  };

  const updateStep = (stepNumber, updates) => {
    setSteps(steps.map(step => 
      step.stepNumber === stepNumber ? { ...step, ...updates } : step
    ));
  };

  const saveJourney = async () => {
    try {
      setSaving(true);
      
      const journeyData = {
        journeyName,
        description: journeyDescription,
        totalSteps: steps.length,
        stepConfiguration: steps
      };

      if (journey) {
        // Update existing journey
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.achievementJourneys,
          journey.$id,
          journeyData
        );
      } else {
        // Create new journey
        await achievementService.createJourney(studentId, journeyData);
      }

      // Redirect back to student page
      router.push(`/admin/students/${studentId}`);
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Error saving journey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (previewMode) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Journey Preview</h1>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Back to Editor
              </Button>
            </div>
            
            <JourneyPreview
              journeyName={journeyName}
              description={journeyDescription}
              steps={steps}
              studentName={student?.name}
            />
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Achievement Journey Builder</h1>
              <p className="text-gray-600">
                Creating custom achievement journey for {student?.name}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              
              <Button
                onClick={saveJourney}
                disabled={saving || !journeyName.trim() || steps.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Journey'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Journey Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Journey Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Journey Name
                    </label>
                    <Input
                      value={journeyName}
                      onChange={(e) => setJourneyName(e.target.value)}
                      placeholder="e.g., Emma's Speech Adventure"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <Textarea
                      value={journeyDescription}
                      onChange={(e) => setJourneyDescription(e.target.value)}
                      placeholder="Brief description of the journey goals"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Steps: {steps.length}
                    </label>
                    <Button
                      onClick={addStep}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {/* Session Assignment Summary */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Session Assignment
                    </label>
                    <div className="text-sm text-gray-600">
                      <div>Total Sessions: {sessions.length}</div>
                      <div>Assigned: {new Set(steps.flatMap(s => s.sessionIds)).size}</div>
                      <div>Unassigned: {sessions.length - new Set(steps.flatMap(s => s.sessionIds)).size}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steps Builder */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {steps.map((step) => (
                  <StepBuilder
                    key={step.stepNumber}
                    step={step}
                    availableSessions={sessions.filter(session => 
                      !steps.some(s => s.stepNumber !== step.stepNumber && s.sessionIds.includes(session.$id))
                    )}
                    onUpdate={(updates) => updateStep(step.stepNumber, updates)}
                    onDelete={() => removeStep(step.stepNumber)}
                    canDelete={steps.length > 1}
                  />
                ))}
                
                {steps.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Steps Created
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Create your first achievement step to get started.
                      </p>
                      <Button onClick={addStep}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Step
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
```

#### File: `components/admin/StepBuilder.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface StepBuilderProps {
  step: AchievementStep;
  availableSessions: Session[];
  onUpdate: (updates: Partial<AchievementStep>) => void;
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
      requiredCompletionCount: Math.min(step.requiredCompletionCount, sessionIds.length)
    });
    setShowSessionSelector(false);
  };

  const handleTrophyToggle = (enabled: boolean) => {
    if (enabled) {
      onUpdate({
        hasTrophy: true,
        trophyData: {
          name: `${step.title} Trophy`,
          icon: "🏆",
          category: "milestone",
          animation: "confetti",
          unlockMessage: `Congratulations on completing ${step.title}!`,
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
      .map(id => availableSessions.find(s => s.$id === id)?.title || `Session ${id.slice(-3)}`)
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
                <CardTitle className="text-lg">Step {step.stepNumber}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {step.hasTrophy && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Trophy className="w-3 h-3 mr-1" />
                      Trophy Step
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {step.sessionIds.length} Sessions
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Step Title</label>
              <Input
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="e.g., Foundation Phase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Required Completions</label>
              <Input
                type="number"
                min="1"
                max={step.sessionIds.length || 1}
                value={step.requiredCompletionCount}
                onChange={(e) => onUpdate({ requiredCompletionCount: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={step.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Brief description of this step's goals"
              rows={2}
            />
          </div>

          {/* Visual Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Step Icon</label>
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
              <label className="block text-sm font-medium mb-2">Step Color</label>
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
            <label className="block text-sm font-medium mb-2">Assigned Sessions</label>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex-1">
                {step.sessionIds.length > 0 ? (
                  <div>
                    <div className="text-sm font-medium">
                      {step.sessionIds.length} session(s) assigned
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {getSessionNames()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No sessions assigned
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionSelector(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Assign Sessions
              </Button>
            </div>
          </div>

          {/* Trophy Configuration */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Trophy Reward</label>
                <p className="text-xs text-gray-600">
                  Award a trophy when this step is completed
                </p>
              </div>
              <Switch
                checked={step.hasTrophy}
                onCheckedChange={handleTrophyToggle}
              />
            </div>
            
            {step.hasTrophy && step.trophyData && (
              <div className="mt-2 p-3 border rounded-lg bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{step.trophyData.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{step.trophyData.name}</div>
                      <div className="text-xs text-gray-600">{step.trophyData.animation} animation</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTrophyDesigner(true)}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Customize
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
          availableSessions={availableSessions.concat(
            step.sessionIds.map(id => availableSessions.find(s => s.$id === id)).filter(Boolean)
          )}
          selectedSessions={step.sessionIds}
          onSelectionChange={handleSessionAssignment}
          onClose={() => setShowSessionSelector(false)}
        />
      )}

      {/* Trophy Designer Modal */}
      {showTrophyDesigner && step.trophyData && (
        <TrophyDesigner
          isOpen={true}
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
```

---

## Implementation Timeline & Next Steps

### Phase 1: Foundation (Week 1)
1. **Database Setup**
   - Create new Appwrite collections (`achievement_journeys`, `trophy_library`)
   - Set up proper permissions and indexes
   - Create achievement service functions

2. **Basic Components**
   - Implement `CustomAchievementJourney` component
   - Create basic `TrophyRevealModal`
   - Add trophy animation system

### Phase 2: Admin Interface (Week 2)
1. **Journey Builder**
   - Build admin achievement builder page
   - Implement `StepBuilder` component
   - Create session assignment interface

2. **Trophy System**
   - Build trophy designer modal
   - Implement trophy library
   - Add animation customization

### Phase 3: Integration (Week 3)
1. **Dashboard Integration**
   - Update dashboard to support achievement mode
   - Add toggle between session-based and achievement-based views
   - Implement progress calculation logic

2. **Mobile Optimization**
   - Ensure responsive design
   - Optimize touch interactions
   - Test on various screen sizes

### Phase 4: Enhancement (Week 4)
1. **Journey Templates**
   - Create template system
   - Add predefined journey options
   - Enable template sharing

2. **Analytics & Reports**
   - Track achievement completion rates
   - Monitor student engagement
   - Generate progress reports

---

## Technical Notes & Considerations

### Performance Optimization
- Use React.memo for expensive step rendering
- Implement virtual scrolling for large step counts
- Lazy load trophy animations
- Cache journey configurations

### Accessibility
- Ensure keyboard navigation support
- Add screen reader compatibility
- Implement high contrast mode support
- Provide alternative text for all visual elements

### Error Handling
- Graceful degradation when journey data is missing
- Validate session assignments to prevent conflicts
- Handle network failures during trophy claims
- Backup and recovery for journey configurations

### Testing Strategy
- Unit tests for achievement calculation logic
- Integration tests for journey CRUD operations
- E2E tests for trophy claim flow
- Performance testing with large session counts

This comprehensive plan provides a complete roadmap for implementing the custom achievement system while maintaining compatibility with the existing codebase. The modular approach allows for incremental development and testing at each phase.
