"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from 'canvas-confetti';

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
        // Sparkle effect using confetti with different settings
        const sparkleDefaults = {
          origin: { y: 0.5 },
          scalar: 1.2,
          startVelocity: 15,
          spread: 360,
          ticks: 60,
          zIndex: 100
        };

        // Multiple sparkle bursts
        setTimeout(() => confetti({ ...sparkleDefaults, particleCount: 20 }), 0);
        setTimeout(() => confetti({ ...sparkleDefaults, particleCount: 15 }), 100);
        setTimeout(() => confetti({ ...sparkleDefaults, particleCount: 10 }), 200);
        break;
        
      case 'glow':
        // Glow effect is handled by CSS animation
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
        {/* Background Glow Effects */}
        {trophy.animation === 'glow' && (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full"
              style={{
                background: `radial-gradient(circle, ${trophy.glowColor}40, transparent)`,
                transform: 'translate(-50%, -50%)'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )}

        {/* Sparkle effects for sparkle animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={trophy.animation === 'sparkles' ? {
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              } : {}}
              transition={{
                duration: 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
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
          <motion.div
            animate={trophy.animation === 'glow' ? {
              filter: [
                'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
                'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
              ]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {showTrophy ? trophy.icon : "❓"}
          </motion.div>
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
    </motion.div>
  );
}
