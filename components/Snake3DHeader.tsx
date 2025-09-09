"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Pseudo-3D Hero Character Component
function Pseudo3DHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Subtle background ambient glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-200/4 via-purple-200/6 to-pink-200/4 rounded-full blur-3xl transform scale-110"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating particles effect - subtle and magical */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full opacity-60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, Math.sin(i) * 8, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 5 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8
            }}
          />
        ))}
      </div>
      
      {/* Sparkle effects around the hero - subtle */}
      <div className="absolute inset-0 z-5">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-70"
            style={{
              left: `${45 + Math.cos(i * Math.PI * 2 / 3) * 20}%`,
              top: `${45 + Math.sin(i * Math.PI * 2 / 3) * 20}%`,
            }}
            animate={{
              scale: [0, 0.8, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1
            }}
          />
        ))}
      </div>

      {/* Main hero container with floating animation */}
      <motion.div
        className="relative z-10"
        animate={{
          y: [0, -15, 0],
          rotateY: [0, 10, 0, -10, 0],
          scale: [1, 1.08, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Primary glow - very subtle */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-300/8 via-purple-300/10 to-pink-300/8 rounded-full blur-2xl transform scale-105"
          animate={{
            scale: [1.02, 1.08, 1.02],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Secondary glow - minimal depth */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-300/5 via-blue-300/6 to-purple-300/5 rounded-full blur-xl transform scale-102"
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        
        {/* Hero image with enhanced pseudo-3D effect */}
        <motion.img
          src="/pseudo3d-hero.png"
          alt="Speech Therapy Hero"
          className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 object-contain"
          style={{
            filter: 'drop-shadow(0 12px 25px rgba(59, 130, 246, 0.2)) drop-shadow(0 4px 15px rgba(168, 85, 247, 0.15))',
            transform: 'perspective(1200px) rotateY(-12deg) rotateX(8deg)',
            transformStyle: 'preserve-3d'
          }}
          initial={{ opacity: 0, scale: 0.3, rotateY: -45, rotateX: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotateY: -12,
            rotateX: 8
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          whileHover={{
            scale: 1.1,
            rotateY: -8,
            transition: { duration: 0.3 }
          }}
        />
        
        {/* Reflection effect */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-20 w-40 h-20 sm:w-48 sm:h-24 lg:w-56 lg:h-28 xl:w-64 xl:h-32 2xl:w-80 2xl:h-40 bg-gradient-to-t from-blue-200/10 via-purple-200/5 to-transparent rounded-full blur-2xl opacity-40"
          animate={{
            scaleX: [0.8, 1.1, 0.8],
            scaleY: [0.5, 0.6, 0.5],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  );
}

// Trophy Display Component
interface TrophyDisplayProps {
  middleCompleted: boolean;
  finalCompleted: boolean;
  middleSessionNumber: number;
  finalSessionNumber: number;
  revealedTrophies: Set<number>;
  onRevealTrophy: (sessionNumber: number) => void;
}

function TrophyDisplay({ middleCompleted, finalCompleted, middleSessionNumber, finalSessionNumber, revealedTrophies, onRevealTrophy }: TrophyDisplayProps) {
  const middleRevealed = revealedTrophies.has(middleSessionNumber);
  const finalRevealed = revealedTrophies.has(finalSessionNumber);
  const [celebratingTrophy, setCelebratingTrophy] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTrophyState = (completed: boolean, revealed: boolean) => {
    if (!completed) return 'locked';
    if (completed && !revealed) return 'unlocked';
    return 'revealed';
  };

  const middleState = getTrophyState(middleCompleted, middleRevealed);
  const finalState = getTrophyState(finalCompleted, finalRevealed);

  const handleRevealClick = (sessionNumber: number) => {
    // Trigger celebration
    setCelebratingTrophy(sessionNumber);
    setShowConfetti(true);
    
    // Start reveal process
    setTimeout(() => {
      onRevealTrophy(sessionNumber);
    }, 500);

    // End celebration
    setTimeout(() => {
      setCelebratingTrophy(null);
      setShowConfetti(false);
    }, 3000);
  };

  // Confetti Component
  const ConfettiParticle = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => (
    <motion.div
      className={`absolute w-2 h-2 ${color} rounded-full`}
      style={{ left: `${startX}%`, top: '20%' }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1, scale: 1 }}
      animate={{
        y: [0, 300, 400],
        x: [0, Math.random() * 200 - 100, Math.random() * 300 - 150],
        rotate: [0, 360, 720],
        opacity: [1, 1, 0],
        scale: [1, 0.8, 0.2]
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: "easeOut"
      }}
    />
  );

  const BurstEffect = ({ x, y, color }: { x: number; y: number; color: string }) => (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 ${color} rounded-full`}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 30) * Math.PI / 180) * 40,
            y: Math.sin((i * 30) * Math.PI / 180) * 40,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full flex flex-col justify-center space-y-8 relative overflow-hidden">
      {/* Confetti Effects */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 0.05}
              color={['bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400'][i % 5]}
              startX={30 + Math.random() * 40}
            />
          ))}
          
          {/* Burst Effects */}
          {celebratingTrophy === middleSessionNumber && (
            <BurstEffect x={120} y={150} color="bg-yellow-400" />
          )}
          {celebratingTrophy === finalSessionNumber && (
            <BurstEffect x={200} y={150} color="bg-purple-400" />
          )}
        </div>
      )}

      <motion.div 
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: celebratingTrophy ? [1, 1.05, 1] : 1,
          rotate: celebratingTrophy ? [0, 1, -1, 0] : 0
        }}
        transition={{ 
          delay: 0.2, 
          duration: celebratingTrophy ? 0.5 : 0.7,
          repeat: celebratingTrophy ? 2 : 0
        }}
      >
        <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
          🏆 Μυστηριώδη Τρόπαια 🏆
        </h3>
        <motion.p 
          className="text-sm sm:text-base lg:text-lg font-medium text-gray-600"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          🌟 Ξεκλείδωσε συνεδρίες για βραβεία! 🌟
        </motion.p>
      </motion.div>

      {/* Trophy Pedestals */}
      <div className="flex justify-center space-x-3 sm:space-x-4 lg:space-x-6">
        {/* Middle Session Trophy */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: middleState === 'revealed' ? [0.9, 1.3, 1.1] : 
                     celebratingTrophy === middleSessionNumber ? [0.9, 1.2, 1.1] : 
                     middleState === 'unlocked' ? 0.95 : 0.9,
              opacity: middleState !== 'locked' ? 1 : 0.7,
              rotateY: celebratingTrophy === middleSessionNumber ? [0, 360] : 0
            }}
            transition={{ 
              duration: celebratingTrophy === middleSessionNumber ? 1.2 : 0.5,
              ease: celebratingTrophy === middleSessionNumber ? "easeOut" : "easeInOut"
            }}
          >
            <div className={`w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-28 rounded-lg border-2 ${
              middleState === 'revealed'
                ? 'bg-gradient-to-t from-yellow-200 to-yellow-100 border-yellow-400 shadow-lg shadow-yellow-200' 
                : middleState === 'unlocked'
                ? 'bg-gradient-to-t from-yellow-100 to-yellow-50 border-yellow-300 shadow-md shadow-yellow-100'
                : 'bg-gradient-to-t from-gray-200 to-gray-100 border-gray-300'
            } flex flex-col items-center justify-center relative overflow-hidden ${
              celebratingTrophy === middleSessionNumber ? 'shadow-2xl shadow-yellow-300' : ''
            }`}>
              
              {/* Trophy or Placeholder */}
              <div className="relative z-10 flex items-center justify-center h-full pb-6">
                {middleState === 'revealed' ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180, y: -20 }}
                    animate={{ 
                      scale: [0, 1.5, 1], 
                      rotate: [-180, 360, 0], 
                      y: [-20, 0, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: 0.5,
                      ease: "backOut"
                    }}
                    className="text-3xl sm:text-4xl lg:text-5xl filter drop-shadow-lg"
                  >
                    👑
                  </motion.div>
                ) : (
                  <motion.div 
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 sm:border-3 border-dashed border-gray-400 flex items-center justify-center"
                    animate={middleState === 'unlocked' ? { 
                      borderColor: ['#fbbf24', '#f59e0b', '#fbbf24'],
                      scale: [1, 1.05, 1],
                      boxShadow: celebratingTrophy === middleSessionNumber ? 
                        ['0 0 0 rgba(251, 191, 36, 0)', '0 0 20px rgba(251, 191, 36, 0.6)', '0 0 0 rgba(251, 191, 36, 0)'] : 
                        '0 0 0 rgba(251, 191, 36, 0)'
                    } : middleState === 'locked' ? {
                      opacity: [0.5, 1, 0.5], 
                      scale: [0.9, 1, 0.9] 
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                      middleState === 'unlocked' ? 'text-yellow-600' : 'text-gray-400'
                    }`}>?</span>
                  </motion.div>
                )}
              </div>

              {/* Pedestal with Text */}
              <div className={`absolute bottom-0 left-0 right-0 h-6 ${
                middleState === 'revealed' ? 'bg-yellow-400' : 
                middleState === 'unlocked' ? 'bg-yellow-300' : 'bg-gray-400'
              } rounded-b-lg flex items-center justify-center`}>
                <span className={`text-sm sm:text-xs lg:text-sm font-bold text-center ${
                  middleState === 'revealed' 
                    ? 'text-yellow-900' 
                    : middleState === 'unlocked' 
                    ? 'text-yellow-800' 
                    : 'text-gray-600'
                }`}>
                  {middleState === 'revealed' ? 'Κορόνα' : `Συνεδρία ${middleSessionNumber}`}
                </span>
              </div>

              {/* Enhanced Sparkle Effect */}
              {middleState === 'revealed' && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                      style={{
                        left: `${10 + (i % 4) * 20}%`,
                        top: `${10 + Math.floor(i / 4) * 25}%`,
                      }}
                      animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Celebration Glow */}
              {celebratingTrophy === middleSessionNumber && (
                <motion.div
                  className="absolute inset-0 bg-yellow-400 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1, repeat: 3 }}
                />
              )}
            </div>
          </motion.div>

          {/* Enhanced Reveal Button */}
          {middleState === 'unlocked' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: celebratingTrophy === middleSessionNumber ? [1, 0.8, 0] : 1
              }}
              transition={{ 
                delay: 0.5,
                duration: celebratingTrophy === middleSessionNumber ? 0.5 : 0.3
              }}
              onClick={() => handleRevealClick(middleSessionNumber)}
              disabled={celebratingTrophy !== null}
              className={`mt-2 sm:mt-3 px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 text-xs sm:text-sm relative overflow-hidden ${
                celebratingTrophy !== null ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={celebratingTrophy === middleSessionNumber ? {
                  scale: [1, 1.2, 0],
                  rotate: [0, 360]
                } : {}}
                transition={{ duration: 0.8 }}
              >
                🎉 Αποκάλυψη! 🎉
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Final Session Trophy */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: finalState === 'revealed' ? [0.9, 1.3, 1.1] : 
                     celebratingTrophy === finalSessionNumber ? [0.9, 1.2, 1.1] : 
                     finalState === 'unlocked' ? 0.95 : 0.9,
              opacity: finalState !== 'locked' ? 1 : 0.7,
              rotateY: celebratingTrophy === finalSessionNumber ? [0, -360] : 0
            }}
            transition={{ 
              duration: celebratingTrophy === finalSessionNumber ? 1.2 : 0.5,
              ease: celebratingTrophy === finalSessionNumber ? "easeOut" : "easeInOut"
            }}
          >
            <div className={`w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-28 rounded-lg border-2 ${
              finalState === 'revealed'
                ? 'bg-gradient-to-t from-purple-200 to-purple-100 border-purple-400 shadow-lg shadow-purple-200' 
                : finalState === 'unlocked'
                ? 'bg-gradient-to-t from-purple-100 to-purple-50 border-purple-300 shadow-md shadow-purple-100'
                : 'bg-gradient-to-t from-gray-200 to-gray-100 border-gray-300'
            } flex flex-col items-center justify-center relative overflow-hidden ${
              celebratingTrophy === finalSessionNumber ? 'shadow-2xl shadow-purple-300' : ''
            }`}>
              
              {/* Trophy or Placeholder */}
              <div className="relative z-10 flex items-center justify-center h-full pb-6">
                {finalState === 'revealed' ? (
                  <motion.div
                    initial={{ scale: 0, rotate: 180, y: -20 }}
                    animate={{ 
                      scale: [0, 1.5, 1], 
                      rotate: [180, -360, 0], 
                      y: [-20, 0, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: 0.5,
                      ease: "backOut"
                    }}
                    className="text-3xl sm:text-4xl lg:text-5xl filter drop-shadow-lg"
                  >
                    💎
                  </motion.div>
                ) : (
                  <motion.div 
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 sm:border-3 border-dashed border-gray-400 flex items-center justify-center"
                    animate={finalState === 'unlocked' ? { 
                      borderColor: ['#a855f7', '#9333ea', '#a855f7'],
                      scale: [1, 1.05, 1],
                      boxShadow: celebratingTrophy === finalSessionNumber ? 
                        ['0 0 0 rgba(168, 85, 247, 0)', '0 0 20px rgba(168, 85, 247, 0.6)', '0 0 0 rgba(168, 85, 247, 0)'] : 
                        '0 0 0 rgba(168, 85, 247, 0)'
                    } : finalState === 'locked' ? {
                      opacity: [0.5, 1, 0.5], 
                      scale: [0.9, 1, 0.9] 
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                      finalState === 'unlocked' ? 'text-purple-600' : 'text-gray-400'
                    }`}>?</span>
                  </motion.div>
                )}
              </div>

              {/* Pedestal with Text */}
              <div className={`absolute bottom-0 left-0 right-0 h-6 ${
                finalState === 'revealed' ? 'bg-purple-400' : 
                finalState === 'unlocked' ? 'bg-purple-300' : 'bg-gray-400'
              } rounded-b-lg flex items-center justify-center`}>
                <span className={`text-sm sm:text-xs lg:text-sm font-bold text-center ${
                  finalState === 'revealed' 
                    ? 'text-purple-900' 
                    : finalState === 'unlocked' 
                    ? 'text-purple-800' 
                    : 'text-gray-600'
                }`}>
                  {finalState === 'revealed' ? 'Διαμάντι' : `Συνεδρία ${finalSessionNumber}`}
                </span>
              </div>

              {/* Enhanced Sparkle Effect */}
              {finalState === 'revealed' && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-purple-400 rounded-full"
                      style={{
                        left: `${10 + (i % 4) * 20}%`,
                        top: `${10 + Math.floor(i / 4) * 25}%`,
                      }}
                      animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, -180, -360]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Celebration Glow */}
              {celebratingTrophy === finalSessionNumber && (
                <motion.div
                  className="absolute inset-0 bg-purple-400 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1, repeat: 3 }}
                />
              )}
            </div>
          </motion.div>

          {/* Enhanced Reveal Button */}
          {finalState === 'unlocked' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: celebratingTrophy === finalSessionNumber ? [1, 0.8, 0] : 1
              }}
              transition={{ 
                delay: 0.7,
                duration: celebratingTrophy === finalSessionNumber ? 0.5 : 0.3
              }}
              onClick={() => handleRevealClick(finalSessionNumber)}
              disabled={celebratingTrophy !== null}
              className={`mt-2 sm:mt-3 px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 text-xs sm:text-sm relative overflow-hidden ${
                celebratingTrophy !== null ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={celebratingTrophy === finalSessionNumber ? {
                  scale: [1, 1.2, 0],
                  rotate: [0, -360]
                } : {}}
                transition={{ duration: 0.8 }}
              >
                🎉 Αποκάλυψη! 🎉
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-3 mt-6">
        <motion.div 
          className={`w-4 h-4 rounded-full border-2 ${
            middleRevealed 
              ? 'bg-yellow-400 border-yellow-500 shadow-lg shadow-yellow-200' 
              : middleState === 'unlocked'
              ? 'bg-yellow-200 border-yellow-400 shadow-md shadow-yellow-100'
              : 'bg-gray-200 border-gray-300'
          }`}
          animate={middleRevealed ? { scale: [1, 1.2, 1] } : middleState === 'unlocked' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <motion.div 
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-purple-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: middleRevealed && finalRevealed ? "100%" : 
                     middleRevealed || finalRevealed ? "50%" : 
                     middleState === 'unlocked' || finalState === 'unlocked' ? "25%" : "0%" 
            }}
            transition={{ duration: 1 }}
          />
        </div>
        <motion.div 
          className={`w-4 h-4 rounded-full border-2 ${
            finalRevealed 
              ? 'bg-purple-400 border-purple-500 shadow-lg shadow-purple-200' 
              : finalState === 'unlocked'
              ? 'bg-purple-200 border-purple-400 shadow-md shadow-purple-100'
              : 'bg-gray-200 border-gray-300'
          }`}
          animate={finalRevealed ? { scale: [1, 1.2, 1] } : finalState === 'unlocked' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </div>
  );
}

// Main 3D Header Component
interface Snake3DHeaderProps {
  studentName: string;
  completedMysteryMiddle: boolean;
  completedMysteryFinal: boolean;
  middleSessionNumber: number;
  finalSessionNumber: number;
  revealedTrophies: Set<number>;
  onRevealTrophy?: (sessionNumber: number) => void;
}

export default function Snake3DHeader({ 
  studentName, 
  completedMysteryMiddle, 
  completedMysteryFinal,
  middleSessionNumber,
  finalSessionNumber,
  revealedTrophies,
  onRevealTrophy
}: Snake3DHeaderProps) {
    const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smoother experience
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRevealTrophy = (sessionNumber: number) => {
    // Call parent callback to handle reveal
    if (onRevealTrophy) {
      onRevealTrophy(sessionNumber);
    }
  };

  return (
    <div className="w-full relative">
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-t-xl p-0.5">
        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-t-xl" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full h-[36rem] sm:h-[40rem] lg:h-[44rem] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-t-xl relative overflow-hidden shadow-2xl"
      >
        {/* Enhanced Background Decorative Elements */}
        <div className="absolute inset-0">
          {/* Floating Orbs */}
          <motion.div 
            className="absolute top-6 left-10 w-16 h-16 bg-blue-300/20 rounded-full blur-2xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-12 right-16 w-10 h-10 bg-purple-300/25 rounded-full blur-xl"
            animate={{ scale: [1, 0.8, 1], y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-8 left-20 w-8 h-8 bg-pink-300/30 rounded-full blur-lg"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-1/3 right-8 w-6 h-6 bg-yellow-300/20 rounded-full blur-md"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.5) 0%, transparent 50%), 
                                   radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.5) 0%, transparent 50%)`
                 }} 
            />
          </div>
        </div>
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-60" />

      <div className="relative z-10 h-full flex flex-col sm:flex-row items-stretch">
        {/* Left Panel - 3D Character */}
        <div className="flex-1 sm:flex-[1.2] flex flex-col p-3 sm:p-4 lg:p-6">
          {/* Character Title */}
          <motion.div 
            className="text-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Ο Ήρωας {studentName}
            </h3>
            <motion.p 
              className="text-sm sm:text-base lg:text-lg font-medium text-gray-600"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              ✨ Εξερευνητής Συνεδριών ✨
            </motion.p>
          </motion.div>

          <div className="flex-1 relative">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96" />
              </div>
            ) : (
              <Pseudo3DHero />
            )}
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-50"></div>

        {/* Right Panel - Trophy Display */}
        <div className="flex-1 flex items-center p-3 sm:p-4 lg:p-6">
          <TrophyDisplay
            middleCompleted={completedMysteryMiddle}
            finalCompleted={completedMysteryFinal}
            middleSessionNumber={middleSessionNumber}
            finalSessionNumber={finalSessionNumber}
            revealedTrophies={revealedTrophies}
            onRevealTrophy={handleRevealTrophy}
          />
        </div>
      </div>
      </motion.div>
    </div>
  );
}

