"use client";

import { motion } from "framer-motion";

interface HeroCharacterProps {
  level: number;
  studentName: string;
  isAnimated?: boolean;
}

export function HeroCharacter({ level, studentName, isAnimated = true }: HeroCharacterProps) {
  const getHeroAppearance = () => {
    switch (level) {
      case 1:
        return {
          emoji: "🦸‍♂️",
          label: "Apprentice Hero",
          color: "from-blue-400 to-blue-600",
          glowColor: "rgba(59, 130, 246, 0.3)"
        };
      case 2:
        return {
          emoji: "🦸‍♀️",
          label: "Rising Hero",
          color: "from-green-400 to-green-600",
          glowColor: "rgba(34, 197, 94, 0.3)"
        };
      case 3:
        return {
          emoji: "⚡️",
          label: "Star Hero",
          color: "from-purple-400 to-purple-600",
          glowColor: "rgba(168, 85, 247, 0.3)"
        };
      case 4:
      default:
        return {
          emoji: "👑",
          label: "Champion Hero",
          color: "from-yellow-400 to-orange-500",
          glowColor: "rgba(251, 146, 60, 0.3)"
        };
    }
  };

  const hero = getHeroAppearance();
  const animationProps = isAnimated ? {
    animate: {
      y: [0, -10, 0],
      scale: [1, 1.02, 1],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div
      className="relative"
      {...animationProps}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 blur-xl rounded-full"
        style={{
          background: hero.glowColor,
          transform: "scale(1.5)"
        }}
      />
      
      {/* Hero container */}
      <div className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${hero.color} flex items-center justify-center shadow-xl`}>
        <span className="text-4xl sm:text-5xl">{hero.emoji}</span>
      </div>
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 min-w-max">
        <div className="text-xs font-bold text-center">
          <div className="text-gray-600">{studentName}</div>
          <div className="text-gray-800">{hero.label}</div>
        </div>
      </div>
    </motion.div>
  );
}
