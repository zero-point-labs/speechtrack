"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp,
  Star,
  Award,
  BookOpen,
  Calendar
} from "lucide-react";

// Magic UI component (you'll need to install this)
interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  className?: string;
}

function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className = "",
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div
      className={`relative size-28 text-xl font-bold ${className}`}
      style={
        {
          "--circle-size": "100px",
          "--circumference": circumference,
          "--percent-to-px": `${percentPx}px`,
          "--gap-percent": "5",
          "--offset-factor": "0",
          "--transition-length": "1s",
          "--transition-step": "200ms",
          "--delay": "0s",
          "--percent-to-deg": "3.6deg",
          transform: "translateZ(0)",
        } as React.CSSProperties
      }
    >
      <svg
        fill="none"
        className="size-full"
        strokeWidth="2"
        viewBox="0 0 100 100"
      >
        {currentPercent <= 90 && currentPercent >= 0 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth="8"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-100"
            style={
              {
                stroke: gaugeSecondaryColor,
                "--stroke-percent": 90 - currentPercent,
                "--offset-factor-secondary": "calc(1 - var(--offset-factor))",
                strokeDasharray:
                  "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                transform:
                  "rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)",
                transition: "all var(--transition-length) ease var(--delay)",
                transformOrigin:
                  "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
              } as React.CSSProperties
            }
          />
        )}
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="8"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-100"
          style={
            {
              stroke: gaugePrimaryColor,
              "--stroke-percent": currentPercent,
              strokeDasharray:
                "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
              transition:
                "var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)",
              transitionProperty: "stroke-dasharray,transform",
              transform:
                "rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))",
              transformOrigin:
                "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
            } as React.CSSProperties
          }
        />
      </svg>
      <span
        data-current-value={currentPercent}
        className="duration-[var(--transition-length)] delay-[var(--delay)] absolute inset-0 m-auto size-fit ease-linear animate-in fade-in"
      >
        {currentPercent}%
      </span>
    </div>
  );
}

interface ProgressCardProps {
  studentName: string;
  completedSessions: number;
  totalSessions: number;
  remainingSessions: number;
  streak?: number;
  level?: string;
  achievements?: string[];
}

export default function EnhancedProgressCard({
  studentName,
  completedSessions,
  totalSessions,
  remainingSessions,
  streak = 0,
  level = "Αρχάριος",
  achievements = [],
}: ProgressCardProps) {
  const [mounted, setMounted] = useState(false);
  const percentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Progress Card */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        {/* Soft Gradient Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/40 via-blue-50/30 to-purple-50/40" />
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50/20 via-transparent to-cyan-50/30" />
        
        {/* Soft Glowing Orbs */}
        <div className="absolute top-4 right-8 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-6 left-6 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-yellow-100/10 to-orange-100/10 rounded-full blur-3xl" />
        
        {/* Subtle Border Glow */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-200/10 via-blue-200/10 to-purple-200/10 p-[1px]">
          <div className="h-full w-full rounded-lg bg-transparent" />
        </div>
        
        <CardContent className="relative pt-6 pb-6 px-4 sm:px-6">
          {/* Header Section */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 shadow-lg mb-4 relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300 via-purple-400 to-blue-400 animate-pulse opacity-60" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-200/30 to-cyan-200/30 blur-sm" />
              <Target className="text-white text-2xl sm:text-3xl relative z-10 drop-shadow-lg" />
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
            >
              Το Λογοθεραπευτικό Ταξίδι {studentName ? `του ${studentName}` : 'της Εμμας'}
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base text-gray-600"
            >
              Κάνει αξιοθαύμαστη πρόοδο κάθε συνεδρία!
            </motion.p>
          </div>
          
          {/* Progress Circle Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="relative"
            >
              <AnimatedCircularProgressBar
                value={percentage}
                gaugePrimaryColor="url(#progressGradient)"
                gaugeSecondaryColor="rgba(229, 231, 235, 0.8)"
                className="drop-shadow-lg"
              />
              <svg className="absolute inset-0 w-full h-full -z-10">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="25%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="75%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            
            {/* Level and Streak Info */}
            <div className="text-center sm:text-left space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-2"
              >
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200">
                  <Award className="w-3 h-3 mr-1" />
                  {level}
                </Badge>
                {streak > 0 && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 border-emerald-200">
                    <Zap className="w-3 h-3 mr-1" />
                    {streak} μέρες
                  </Badge>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-xs sm:text-sm text-gray-600 space-y-1"
              >
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Επόμενη συνεδρία: Σύντομα</span>
                </div>
                {achievements.length > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{achievements.length} επιτεύγματα</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
          
          {/* Stats Grid - Stacked vertically on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4"
          >
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/80 border border-emerald-200/30 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-emerald-600 mb-1">
                {completedSessions}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Ολοκληρωμένες
              </div>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-pink-50/80 border border-amber-200/30 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-amber-600 mb-1">
                {remainingSessions}
              </div>
              <div className="text-sm text-amber-700 font-medium">
                Υπολείπονται
              </div>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-fuchsia-50/80 border border-violet-200/30 shadow-sm">
              <div className="text-lg sm:text-2xl font-bold text-violet-600 mb-1">
                {totalSessions}
              </div>
              <div className="text-sm text-violet-700 font-medium">
                Συνολικές
              </div>
            </div>
          </motion.div>
          
          {/* Progress Bar for Mobile Enhancement */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-6 space-y-2"
          >
            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
              <span>Πρόοδος</span>
              <span>{percentage}%</span>
            </div>
            <div className="relative">
              <Progress 
                value={percentage} 
                className="h-2 bg-gray-100/80"
              />
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 via-purple-500 via-blue-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
                   style={{ width: `${percentage}%` }} 
              />
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-300/50 via-purple-300/50 via-blue-300/50 via-cyan-300/50 to-amber-300/50 rounded-full blur-sm transition-all duration-1000 ease-out"
                   style={{ width: `${percentage}%` }} 
              />
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
