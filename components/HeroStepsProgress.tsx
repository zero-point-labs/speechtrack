"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Lock, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  sessionNumber: number;
  status: "completed" | "available" | "locked";
  date?: string;
  title?: string;
}

interface HeroStepsProgressProps {
  studentName: string;
  sessions: Session[];
  currentSessionIndex: number;
  onSessionClick?: (session: Session) => void;
  showParentInfo?: boolean;
}

export default function HeroStepsProgress({
  studentName,
  sessions,
  currentSessionIndex,
  onSessionClick,
  showParentInfo = false,
}: HeroStepsProgressProps) {
  const [mounted, setMounted] = useState(false);
  const [heroPosition, setHeroPosition] = useState(0);
  const pathRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate hero level based on completed sessions
  const completedSessions = sessions.filter(s => s.status === "completed").length;
  const heroLevel = Math.min(Math.floor(completedSessions / 3) + 1, 4);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Position hero on current session circle
    if (mounted && circleRefs.current[currentSessionIndex]) {
      const circle = circleRefs.current[currentSessionIndex];
      const container = pathRef.current;
      if (circle && container) {
        const circleRect = circle.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const position = circleRect.left - containerRect.left + (circleRect.width / 2) - 30; // 30 is half hero width
        setHeroPosition(position);
      }
    }
  }, [mounted, currentSessionIndex, sessions]);

  if (!mounted) return null;

  return (
    <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-b from-sky-50 to-sky-100">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
              Το Ταξίδι του {studentName || 'Ήρωα'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Επίπεδο {heroLevel} Ήρωας • {completedSessions} από {sessions.length} συνεδρίες
            </p>
          </div>
          {showParentInfo && (
            <button className="p-2 rounded-full hover:bg-sky-200/50 transition-colors">
              <Info className="w-5 h-5 text-sky-600" />
            </button>
          )}
        </div>

        {/* Journey Path Container */}
        <div className="relative" ref={pathRef}>
          {/* Path Background */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 -translate-y-1/2" />
          
          {/* Session Circles Path */}
          <div className="relative flex justify-between items-center py-8 overflow-x-auto scrollbar-hide">
            {sessions.map((session, index) => {
              const isCompleted = session.status === "completed";
              const isAvailable = session.status === "available";
              const isLocked = session.status === "locked";
              const isCurrent = index === currentSessionIndex;

              return (
                <div key={session.id} className="flex-shrink-0 relative">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "absolute top-1/2 right-1/2 w-full h-0.5 -translate-y-1/2",
                        sessions[index - 1].status === "completed" ? "bg-green-400" : "bg-gray-300"
                      )}
                      style={{ width: "calc(100% + 2rem)" }}
                    />
                  )}

                  {/* Session Circle */}
                  <div
                    ref={el => circleRefs.current[index] = el}
                    onClick={() => !isLocked && onSessionClick?.(session)}
                    className={cn(
                      "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer z-10",
                      "hover:scale-110 active:scale-95",
                      isCompleted && "bg-gradient-to-br from-green-400 to-green-500 shadow-md",
                      isAvailable && "bg-gradient-to-br from-blue-400 to-blue-500 shadow-md animate-pulse",
                      isLocked && "bg-gray-300 cursor-not-allowed",
                      isCurrent && "ring-4 ring-yellow-400 ring-offset-2"
                    )}
                  >
                    {isCompleted && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                    {isAvailable && <span className="text-white font-bold">{index + 1}</span>}
                    {isLocked && <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
                  </div>

                  {/* Session Number Label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                    Συνεδρία {index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hero Character */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ x: 0, y: -60 }}
            animate={{ x: heroPosition, y: -60 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <div className={cn("hero-container", `hero-level-${heroLevel}`)}>
              {/* Hero Body */}
              <div className="hero-body relative w-16 h-20">
                {/* Head */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-peach rounded-full">
                  {/* Mask */}
                  <div className={cn(
                    "absolute top-2 left-0 right-0 h-4 rounded-full",
                    heroLevel === 1 && "bg-blue-600",
                    heroLevel === 2 && "bg-purple-600",
                    heroLevel === 3 && "bg-red-600",
                    heroLevel === 4 && "bg-gradient-to-r from-yellow-400 to-orange-400"
                  )} />
                  {/* Eyes */}
                  <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-white rounded-full" />
                  <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-white rounded-full" />
                  {/* Smile */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-gray-700 rounded-b-full" />
                </div>

                {/* Body */}
                <div className={cn(
                  "absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg",
                  heroLevel === 1 && "bg-blue-500",
                  heroLevel === 2 && "bg-purple-500",
                  heroLevel === 3 && "bg-red-500",
                  heroLevel === 4 && "bg-gradient-to-b from-yellow-400 to-orange-400"
                )}>
                  {/* Star Badge (Level 4) */}
                  {heroLevel >= 4 && (
                    <Star className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 text-white fill-white" />
                  )}
                </div>

                {/* Cape (Level 2+) */}
                {heroLevel >= 2 && (
                  <div className={cn(
                    "hero-cape absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-t-lg origin-top",
                    heroLevel === 2 && "bg-purple-600",
                    heroLevel === 3 && "bg-red-600",
                    heroLevel === 4 && "bg-gradient-to-b from-orange-500 to-red-500"
                  )}>
                    {/* Stars on cape (Level 3+) */}
                    {heroLevel >= 3 && (
                      <>
                        <Star className="absolute top-2 left-1 w-2 h-2 text-yellow-300 fill-yellow-300" />
                        <Star className="absolute top-4 right-1 w-2 h-2 text-yellow-300 fill-yellow-300" />
                      </>
                    )}
                  </div>
                )}

                {/* Arms */}
                <div className="absolute top-9 left-0 w-2 h-4 bg-peach rounded-full transform -rotate-12" />
                <div className="absolute top-9 right-0 w-2 h-4 bg-peach rounded-full transform rotate-12" />
              </div>

              {/* Sparkle Effect (Level 4) */}
              {heroLevel >= 4 && (
                <div className="sparkle-container absolute inset-0 pointer-events-none">
                  <div className="sparkle sparkle-1" />
                  <div className="sparkle sparkle-2" />
                  <div className="sparkle sparkle-3" />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Progress Stats (Mobile-friendly) */}
        <div className="mt-8 pt-4 border-t border-sky-200">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-100 rounded-lg p-2">
              <div className="text-lg font-bold text-green-700">{completedSessions}</div>
              <div className="text-xs text-green-600">Ολοκληρωμένες</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-700">
                {sessions.filter(s => s.status === "available").length}
              </div>
              <div className="text-xs text-blue-600">Διαθέσιμες</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-700">
                {sessions.filter(s => s.status === "locked").length}
              </div>
              <div className="text-xs text-gray-600">Κλειδωμένες</div>
            </div>
          </div>
        </div>
      </CardContent>

      <style jsx>{`
        .hero-cape {
          animation: cape-wave 3s ease-in-out infinite;
          clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
        }

        @keyframes cape-wave {
          0%, 100% { transform: translateX(-50%) skewX(0deg); }
          50% { transform: translateX(-50%) skewX(3deg); }
        }

        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          opacity: 0;
        }

        .sparkle-1 {
          top: -5px;
          left: 10px;
          animation: sparkle 2s linear infinite;
        }

        .sparkle-2 {
          top: 5px;
          right: 5px;
          animation: sparkle 2s linear infinite 0.5s;
        }

        .sparkle-3 {
          bottom: 10px;
          left: 5px;
          animation: sparkle 2s linear infinite 1s;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        .bg-peach {
          background-color: #FDBCB4;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Card>
  );
}
