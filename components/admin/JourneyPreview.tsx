"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HeroCharacter } from "@/components/HeroCharacter";

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

interface JourneyPreviewProps {
  journeyName: string;
  description: string;
  steps: Step[];
  studentName?: string;
}

export function JourneyPreview({
  journeyName,
  description,
  steps,
  studentName = "Preview Student"
}: JourneyPreviewProps) {
  
  // Simulate some progress for preview
  const simulateProgress = (stepNumber: number) => {
    if (stepNumber === 1) return { completed: true, progress: 100 };
    if (stepNumber === 2) return { completed: false, progress: 60 };
    return { completed: false, progress: 0 };
  };

  const getStepState = (step: Step) => {
    const progress = simulateProgress(step.stepNumber);
    
    if (step.stepNumber > 2) return 'locked';
    if (progress.completed && step.hasTrophy) return 'claimable';
    if (progress.completed) return 'completed';
    return 'available';
  };

  return (
    <Card className="w-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {journeyName || "Achievement Journey"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {description || "Your path to speech mastery"}
          </p>
          
          {/* Hero Character */}
          <div className="flex justify-center mb-4">
            <HeroCharacter 
              level={2}
              studentName={studentName}
              isAnimated={true}
            />
          </div>
          
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Preview Mode
          </div>
        </div>

        {/* Steps Progress Path */}
        <div className="relative mb-6">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2 rounded-full z-0" />
          
          {/* Steps Container */}
          <div className="relative flex justify-between items-center py-4 overflow-x-auto scrollbar-hide">
            {steps.map((step, index) => {
              const state = getStepState(step);
              const progress = simulateProgress(step.stepNumber);
              
              return (
                <div key={step.stepNumber} className="flex-shrink-0 relative">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div
                      className={`absolute top-1/2 right-1/2 w-full h-1 -translate-y-1/2 transition-colors z-0 ${
                        simulateProgress(steps[index - 1].stepNumber).completed 
                          ? 'bg-gradient-to-r from-green-400 to-blue-400' 
                          : 'bg-gray-300'
                      }`}
                      style={{ width: "calc(100% + 2rem)" }}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all z-10 ${
                      state === 'locked' && 'opacity-50'
                    }`}
                    style={{ backgroundColor: step.color }}
                  >
                    {/* Step Content */}
                    {state === 'locked' && (
                      <div className="text-2xl">🔒</div>
                    )}
                    
                    {state === 'available' && (
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl mb-1">{step.icon}</div>
                        {progress.progress > 0 && (
                          <div className="text-xs text-white font-bold">
                            {Math.round(progress.progress)}%
                          </div>
                        )}
                      </div>
                    )}
                    
                    {state === 'claimable' && (
                      <div className="text-2xl sm:text-3xl animate-pulse">
                        ❓
                      </div>
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

                    {/* Progress Ring for available steps */}
                    {state === 'available' && progress.progress > 0 && progress.progress < 100 && (
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
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress.progress / 100)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center min-w-max">
                    <div className="text-xs font-medium text-gray-700">
                      {step.title}
                    </div>
                  </div>

                  {/* Trophy indicator for claimable steps */}
                  {state === 'claimable' && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                      <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                        🏆 Trophy Available!
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Journey Stats (Preview) */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
            <div className="text-lg font-bold text-green-600">1</div>
            <div className="text-xs text-green-700">Completed Steps</div>
          </div>
          
          <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
            <div className="text-lg font-bold text-blue-600">
              {steps.filter(s => s.hasTrophy).length}
            </div>
            <div className="text-xs text-blue-700">Total Trophies</div>
          </div>
          
          <div className="text-center p-3 rounded-xl bg-white/70 backdrop-blur-sm">
            <div className="text-lg font-bold text-purple-600">
              {Math.round((1 / steps.length) * 100)}%
            </div>
            <div className="text-xs text-purple-700">Journey Progress</div>
          </div>
        </div>

        {/* Preview Note */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-700">
            This is a preview of how the achievement journey will appear to students.
            Progress shown is simulated for demonstration purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
