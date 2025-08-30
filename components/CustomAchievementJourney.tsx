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
  journeyName: string;
  description: string;
  totalSteps: number;
  stepConfiguration: AchievementStep[];
  isActive: boolean;
  createdAt: string;
}

interface CustomAchievementJourneyProps {
  studentId: string;
  studentName: string;
  onStepClick?: (step: AchievementStep) => void;
  showParentInfo?: boolean;
}

export default function CustomAchievementJourney({
  studentId,
  studentName,
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
      
      // First, auto-update the journey progress based on completed sessions
      console.log('🔄 Auto-updating journey progress for student:', studentId);
      const updateResult = await achievementService.autoUpdateJourneyProgress(studentId);
      console.log('✅ Auto-update result:', updateResult);
      
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
      // Show trophy reveal modal
      setTrophyToReveal({
        step,
        trophy: step.trophyData
      });
      
      // Mark trophy as claimed
      await achievementService.updateJourneyStep(journey.$id, step.stepNumber, {
        'trophyData.isClaimed': true,
        'trophyData.claimedAt': new Date().toISOString()
      });
      
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
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
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
      <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {journey.journeyName}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {journey.description}
            </p>
            
            {/* Hero Character */}
            <div className="flex justify-center mb-6">
              <HeroCharacter 
                level={calculateHeroLevel()}
                studentName={studentName}
                isAnimated={true}
              />
            </div>
          </div>

          {/* Snake Board Layout */}
          <div className="mb-8 relative">
            {/* Create a position map for snake pattern */}
            {(() => {
              const positions: {[key: number]: {row: number, col: number}} = {};
              journey.stepConfiguration.forEach((_, index) => {
                const row = Math.floor(index / 4);
                const col = (row % 2 === 0) ? (index % 4) : (3 - (index % 4)); // Snake pattern
                positions[index] = {row, col};
              });
              
              const numRows = Math.ceil(journey.stepConfiguration.length / 4);
              
              return (
                <div className="space-y-8">
                  {Array.from({ length: numRows }, (_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-6 sm:gap-8 relative">
                      {Array.from({ length: 4 }, (_, colIndex) => {
                        // Find which step should be in this position
                        const stepIndex = Object.keys(positions).find(key => {
                          const pos = positions[parseInt(key)];
                          return pos.row === rowIndex && pos.col === colIndex;
                        });
                        
                        if (!stepIndex) {
                          return <div key={`empty-${rowIndex}-${colIndex}`} className="w-20 h-20 sm:w-24 sm:h-24"></div>;
                        }
                        
                        const step = journey.stepConfiguration[parseInt(stepIndex)];
                        const progress = stepProgress[step.stepNumber] || {};
                        const state = getStepState(step, progress);
                        const nextStep = journey.stepConfiguration[parseInt(stepIndex) + 1];
                        const prevStep = journey.stepConfiguration[parseInt(stepIndex) - 1];
                        
                        return (
                          <div key={step.stepNumber} className="relative flex flex-col items-center">
                            {/* Connection Lines */}
                            {(() => {
                              const currentIndex = parseInt(stepIndex);
                              const nextStepExists = journey.stepConfiguration[currentIndex + 1];
                              
                              if (!nextStepExists) return null;
                              
                              const currentPos = positions[currentIndex];
                              const nextPos = positions[currentIndex + 1];
                              
                              // Within same row - horizontal line
                              if (currentPos.row === nextPos.row) {
                                const direction = currentPos.col < nextPos.col ? 'right' : 'left';
                                return (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 ${
                                      direction === 'right' 
                                        ? 'left-full ml-2 sm:ml-3' 
                                        : 'right-full mr-2 sm:mr-3'
                                    } w-4 sm:w-6 h-0.5 ${
                                      step.isCompleted 
                                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500' 
                                        : 'bg-gray-300'
                                    } transition-colors duration-300`}
                                  />
                                );
                              }
                              
                              // Between rows - vertical connection
                              return (
                                <div
                                  className={`absolute top-full mt-2 sm:mt-3 left-1/2 w-0.5 h-4 sm:h-6 -translate-x-1/2 ${
                                    step.isCompleted 
                                      ? 'bg-gradient-to-b from-emerald-500 to-blue-500' 
                                      : 'bg-gray-300'
                                  } transition-colors duration-300`}
                                />
                              );
                            })()}

                            {/* Square Achievement Step */}
                            <motion.div
                              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 cursor-pointer transition-all duration-300 z-10 ${
                                state === 'locked' ? 'opacity-50 cursor-not-allowed' : ''
                              } ${
                                step.isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-500 shadow-lg shadow-emerald-200' 
                                  : state === 'claimable'
                                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-orange-500 shadow-lg shadow-orange-200'
                                  : state === 'available'
                                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500 shadow-lg shadow-blue-200'
                                  : 'bg-white border-gray-300 shadow-sm hover:shadow-md'
                              }`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 * (step.stepNumber - 1), duration: 0.6 }}
                              whileHover={state !== 'locked' ? { scale: 1.05 } : {}}
                              whileTap={state !== 'locked' ? { scale: 0.95 } : {}}
                              onClick={() => state === 'claimable' && handleTrophyClaim(step)}
                            >
                              {/* Icon Content */}
                              <div className={`w-full h-full flex items-center justify-center ${
                                step.isCompleted || state === 'claimable' || state === 'available' 
                                  ? 'text-white' 
                                  : 'text-gray-400'
                              }`}>
                                {step.isCompleted ? (
                                  // Checkmark icon for completed steps
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : state === 'claimable' ? (
                                  // Trophy icon for claimable steps
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </motion.div>
                                ) : state === 'available' ? (
                                  // Play icon for current/active steps
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  // Lock icon for locked steps
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>

                              {/* Progress indicator for active steps */}
                              {state === 'available' && progress?.percentage > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-lg overflow-hidden">
                                  <div 
                                    className="h-full bg-white transition-all duration-300"
                                    style={{ width: `${progress.percentage}%` }}
                                  />
                                </div>
                              )}

                            </motion.div>

                            {/* Step Label */}
                            <div className="mt-2 text-center">
                              <div className="text-xs sm:text-sm font-medium text-gray-700">
                                {step.customTitle || `Βήμα ${step.stepNumber}`}
                              </div>
                            </div>

                            {/* Trophy Claim Button */}
                            {state === 'claimable' && (
                              <motion.div
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                              >
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold shadow-lg text-xs px-3 py-1 whitespace-nowrap"
                                  onClick={() => handleTrophyClaim(step)}
                                >
                                  🏆 Claim!
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Journey Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16">
            <div className="text-center p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                {journey.stepConfiguration.filter(s => s.isCompleted).length}
              </div>
              <div className="text-sm font-medium text-green-700">Completed Steps</div>
            </div>
            
            <div className="text-center p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                {journey.stepConfiguration.filter(s => s.hasTrophy && s.trophyData?.isClaimed).length}
              </div>
              <div className="text-sm font-medium text-blue-700">Trophies Earned</div>
            </div>
            
            <div className="text-center p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                {Math.round((journey.stepConfiguration.filter(s => s.isCompleted).length / journey.totalSteps) * 100)}%
              </div>
              <div className="text-sm font-medium text-purple-700">Journey Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trophy Reveal Modal */}
      <AnimatePresence>
        {trophyToReveal && (
          <TrophyRevealModal
            trophy={trophyToReveal.trophy}
            step={trophyToReveal.step}
            studentName={studentName}
            onClose={() => setTrophyToReveal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}