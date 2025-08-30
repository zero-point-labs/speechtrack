"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Lock, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Trophy,
  HelpCircle,
  Crown,
  Gem
} from "lucide-react";
import Snake3DHeader from "./Snake3DHeader";

interface Session {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'locked' | 'available' | 'canceled';
  isPaid?: boolean;
  achievement?: {
    type: string;
    icon: string;
    title: string;
    description: string;
  };
}

interface GlobalMysteryStatus {
  middleCompleted: boolean;
  finalCompleted: boolean;
  middleSessionNumber: number;
  finalSessionNumber: number;
}

interface SessionSnakeBoardProps {
  sessions: Session[];
  studentName: string;
  onSessionClick?: (session: Session) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  totalSessions?: number; // Total sessions across all pages
  completedSessions?: number; // Total completed sessions across all pages
  globalMysteryStatus?: GlobalMysteryStatus;
}

export default function SessionSnakeBoard({
  sessions,
  studentName,
  onSessionClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  totalSessions,
  completedSessions = 0,
  globalMysteryStatus
}: SessionSnakeBoardProps) {
  const [mounted, setMounted] = useState(false);
  const [revealedTrophies, setRevealedTrophies] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load revealed trophies from localStorage
    if (studentName) {
      const savedRevealed = localStorage.getItem(`revealed-trophies-${studentName}`);
      if (savedRevealed) {
        setRevealedTrophies(new Set(JSON.parse(savedRevealed)));
      }
    }
  }, [studentName]);

  // Clear revealed state if mystery sessions are no longer completed (using global status)
  useEffect(() => {
    if (!studentName || !globalMysteryStatus) return;

    const newRevealed = new Set(revealedTrophies);
    let hasChanges = false;

    // Use numeric session numbers for consistency with trophy reveal logic
    const middleSessionNumber = globalMysteryStatus.middleSessionNumber;
    const finalSessionNumber = globalMysteryStatus.finalSessionNumber;

    // Check middle session
    if (!globalMysteryStatus.middleCompleted && revealedTrophies.has(middleSessionNumber)) {
      newRevealed.delete(middleSessionNumber);
      hasChanges = true;
    }

    // Check final session  
    if (!globalMysteryStatus.finalCompleted && revealedTrophies.has(finalSessionNumber)) {
      newRevealed.delete(finalSessionNumber);
      hasChanges = true;
    }

    if (hasChanges) {
      setRevealedTrophies(newRevealed);
      localStorage.setItem(`revealed-trophies-${studentName}`, JSON.stringify([...newRevealed]));
    }
  }, [globalMysteryStatus?.middleCompleted, globalMysteryStatus?.finalCompleted, globalMysteryStatus?.middleSessionNumber, globalMysteryStatus?.finalSessionNumber, studentName, revealedTrophies]);

  const handleRevealTrophy = (sessionNumber: number) => {
    const newRevealed = new Set(revealedTrophies);
    newRevealed.add(sessionNumber);
    setRevealedTrophies(newRevealed);
    
    // Save to localStorage
    if (studentName) {
      localStorage.setItem(`revealed-trophies-${studentName}`, JSON.stringify([...newRevealed]));
    }
  };

  if (!mounted) return null;

  // Use global mystery status or calculate locally as fallback
  const mysteryStatus = globalMysteryStatus || {
    middleCompleted: false,
    finalCompleted: false,
    middleSessionNumber: -1,
    finalSessionNumber: -1
  };

  const specialSessions = {
    middle: mysteryStatus.middleSessionNumber,
    last: mysteryStatus.finalSessionNumber
  };

  // Helper function to extract numeric session number from string
  const getSessionNumber = (sessionNumber: number | string) => {
    if (typeof sessionNumber === 'string' && sessionNumber.includes(' - ')) {
      const num = parseInt(sessionNumber.split(' - ')[0]);
      return isNaN(num) ? sessionNumber : num;
    }
    return typeof sessionNumber === 'number' ? sessionNumber : parseInt(sessionNumber) || 0;
  };

  const isSpecialSession = (sessionNumber: number | string) => {
    const numericSessionNumber = getSessionNumber(sessionNumber);
    return numericSessionNumber === specialSessions.middle || numericSessionNumber === specialSessions.last;
  };

  const getSpecialSessionType = (sessionNumber: number | string) => {
    const numericSessionNumber = getSessionNumber(sessionNumber);
    if (numericSessionNumber === specialSessions.middle) return 'middle';
    if (numericSessionNumber === specialSessions.last) return 'final';
    return null;
  };

  // Calculate snake positions for sessions - responsive for mobile (2 cols) and desktop (4 cols)
  const getSnakePosition = (index: number, columns: number = 4) => {
    const row = Math.floor(index / columns);
    const col = (row % 2 === 0) ? (index % columns) : ((columns - 1) - (index % columns)); // Snake pattern
    return { row, col };
  };

  const getConnectionPath = (currentIndex: number, nextIndex: number, columns: number = 4) => {
    if (nextIndex >= sessions.length) return null;
    
    const currentPos = getSnakePosition(currentIndex, columns);
    const nextPos = getSnakePosition(nextIndex, columns);
    
    // Same row - horizontal connection
    if (currentPos.row === nextPos.row) {
      const direction = currentPos.col < nextPos.col ? 'right' : 'left';
      return {
        type: 'horizontal',
        direction,
        className: `absolute top-1/2 -translate-y-1/2 h-1 ${
          direction === 'right' 
            ? 'left-full ml-1' 
            : 'right-full mr-1'
        } w-2 sm:w-4`
      };
    }
    
    // Between rows - vertical connection  
    return {
      type: 'vertical',
      className: 'absolute top-full mt-1 left-1/2 w-1 h-2 sm:h-4 -translate-x-1/2'
    };
  };

  const getStatusColor = (session: Session) => {
    const isSpecial = isSpecialSession(session.sessionNumber);
    const specialType = getSpecialSessionType(session.sessionNumber);
    
    switch (session.status) {
      case 'completed':
        if (isSpecial) {
          if (specialType === 'middle') {
            return 'from-yellow-400 to-orange-500 border-yellow-500 shadow-yellow-200';
          } else if (specialType === 'final') {
            return 'from-purple-400 to-indigo-600 border-purple-500 shadow-purple-200';
          }
        }
        return 'from-emerald-400 to-emerald-600 border-emerald-500 shadow-emerald-200';
      case 'available':
        if (isSpecial) {
          return 'from-cyan-400 to-blue-600 border-cyan-500 shadow-cyan-200';
        }
        return 'from-blue-400 to-blue-600 border-blue-500 shadow-blue-200';
      case 'canceled':
        return 'from-red-400 to-red-600 border-red-500 shadow-red-200';
      default:
        if (isSpecial) {
          return 'from-gray-100 to-gray-200 border-gray-300 shadow-gray-200';
        }
        return 'from-gray-100 to-gray-200 border-gray-300 shadow-gray-200';
    }
  };

  const getOutlineColor = (session: Session) => {
    const isSpecial = isSpecialSession(session.sessionNumber);
    const specialType = getSpecialSessionType(session.sessionNumber);
    
    switch (session.status) {
      case 'completed':
        if (isSpecial) {
          if (specialType === 'middle') {
            return 'bg-gradient-to-r from-yellow-500 to-orange-500';
          } else if (specialType === 'final') {
            return 'bg-gradient-to-r from-purple-500 to-indigo-500';
          }
        }
        return 'bg-gradient-to-r from-emerald-500 to-blue-500';
      case 'available':
        if (isSpecial) {
          return 'bg-gradient-to-r from-cyan-400 to-blue-500';
        }
        return 'bg-gradient-to-r from-blue-400 to-purple-500';
      case 'canceled':
        return 'bg-gradient-to-r from-red-400 to-red-500';
      default:
        if (isSpecial) {
          return 'bg-gradient-to-r from-gray-200 to-gray-300';
        }
        return 'bg-gray-200';
    }
  };

  const getStatusIcon = (session: Session) => {
    const isSpecial = isSpecialSession(session.sessionNumber);
    const specialType = getSpecialSessionType(session.sessionNumber);
    const numericSessionNumber = getSessionNumber(session.sessionNumber);
    const isRevealed = revealedTrophies.has(numericSessionNumber);
    
    switch (session.status) {
      case 'completed':
        if (isSpecial) {
          // Check if trophy is revealed
          if (isRevealed) {
            // Show actual trophy with reveal animation
            if (specialType === 'middle') {
              return (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-200" />
                </motion.div>
              );
            } else if (specialType === 'final') {
              return (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Gem className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-200" />
                </motion.div>
              );
            }
          } else {
            // Show special question mark for completed but not revealed
            return (
              <motion.div
                animate={{ 
                  borderColor: specialType === 'middle' ? ['#fbbf24', '#f59e0b', '#fbbf24'] : ['#a855f7', '#9333ea', '#a855f7'],
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full border-2 border-dashed flex items-center justify-center"
              >
                <HelpCircle className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${
                  specialType === 'middle' ? 'text-yellow-300' : 'text-purple-300'
                }`} />
              </motion.div>
            );
          }
        }
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />;
      case 'available':
        if (isSpecial) {
          // Show question mark for special available sessions
          return (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
            </motion.div>
          );
        }
        return <span className={`font-bold text-xs sm:text-sm ${
          session.status === 'locked' ? 'text-gray-600' : 'text-white'
        }`}>{session.sessionNumber}</span>;
      case 'canceled':
        return <span className="text-white text-sm sm:text-base lg:text-lg">×</span>;
      default:
        if (isSpecial) {
          // Show question mark for special locked sessions too
          return (
            <motion.div
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.9, 1, 0.9]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <HelpCircle className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-gray-500" />
            </motion.div>
          );
        }
        return <Lock className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-gray-600" />;
    }
  };



  const numRowsDesktop = Math.ceil(sessions.length / 4);
  const numRowsMobile = Math.ceil(sessions.length / 2);

  if (loading) {
    return (
      <div className="w-full">
        {/* 3D Header - Loading State */}
        <Snake3DHeader
          studentName={studentName}
          completedMysteryMiddle={false}
          completedMysteryFinal={false}
          middleSessionNumber={specialSessions.middle}
          finalSessionNumber={specialSessions.last}
          revealedTrophies={revealedTrophies}
          onRevealTrophy={handleRevealTrophy}
        />
        
        {/* Loading Snake Board */}
        <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 rounded-t-none">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 3D Header */}
      <Snake3DHeader
        studentName={studentName}
        completedMysteryMiddle={mysteryStatus.middleCompleted}
        completedMysteryFinal={mysteryStatus.finalCompleted}
        middleSessionNumber={specialSessions.middle}
        finalSessionNumber={specialSessions.last}
        revealedTrophies={revealedTrophies}
        onRevealTrophy={handleRevealTrophy}
      />
      
      {/* Main Snake Board Card */}
      <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 rounded-t-none">
        <CardContent className="p-4 sm:p-6 lg:p-8">


        {/* Pagination Controls - Top */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Προηγούμενη</span>
            </Button>
            
            <span className="text-sm text-gray-600">
              Σελίδα {currentPage} από {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1"
            >
              <span className="hidden sm:inline">Επόμενη</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Snake Board */}
        <div className="relative mb-8">
          
          {/* Mobile Layout (2 columns) */}
          <div className="sm:hidden space-y-4">
            {Array.from({ length: numRowsMobile }, (_, rowIndex) => (
              <div key={`mobile-${rowIndex}`} className="relative">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 2 }, (_, colIndex) => {
                    // Find which session should be in this position
                    const sessionIndex = sessions.findIndex((_, i) => {
                      const pos = getSnakePosition(i, 2);
                      return pos.row === rowIndex && pos.col === colIndex;
                    });
                    
                    if (sessionIndex === -1) {
                      return (
                        <div key={`mobile-empty-${rowIndex}-${colIndex}`} className="h-14">
                          {/* Empty cell */}
                        </div>
                      );
                    }
                    
                    const session = sessions[sessionIndex];
                    const nextSession = sessions[sessionIndex + 1];
                    const connectionPath = nextSession ? getConnectionPath(sessionIndex, sessionIndex + 1, 2) : null;
                    
                    return (
                      <div key={session.id} className="relative">
                        {/* Outline/Connection to next session */}
                        {connectionPath && (
                          <div
                            className={`${connectionPath.className} ${getOutlineColor(session)} transition-colors duration-500 rounded-full`}
                          />
                        )}

                        {/* Session Card with outer outline effect */}
                        <div className="relative p-1 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                          {/* Outer glow effect */}
                          <div 
                            className={`absolute -inset-1 rounded-xl opacity-60 blur-sm transition-all duration-500 ${
                              isSpecialSession(session.sessionNumber) && session.status === 'completed'
                                ? getSpecialSessionType(session.sessionNumber) === 'middle' 
                                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                  : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                                : session.status === 'completed' 
                                ? 'bg-gradient-to-br from-emerald-400 to-blue-500' 
                                : session.status === 'available'
                                ? isSpecialSession(session.sessionNumber) 
                                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                                  : 'bg-gradient-to-br from-blue-400 to-purple-500'
                                : session.status === 'canceled'
                                ? 'bg-gradient-to-br from-red-400 to-red-500'
                                : 'bg-gray-200'
                            }`}
                          />
                          
                          {/* Main session card */}
                          <motion.div
                            className={`relative w-full h-14 sm:h-16 lg:h-20 rounded-lg border-2 cursor-pointer transition-all duration-300 bg-gradient-to-br ${getStatusColor(session)} shadow-lg ${
                              session.status === 'locked' ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
                            }`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.05 * sessionIndex, duration: 0.5 }}
                            whileHover={session.status !== 'locked' ? { scale: 1.05 } : {}}
                            whileTap={session.status !== 'locked' ? { scale: 0.95 } : {}}
                            onClick={() => session.status !== 'locked' && onSessionClick?.(session)}
                          >
                            {/* Card Content */}
                            <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
                              {/* Status Icon */}
                              <div className="mb-1">
                                {getStatusIcon(session)}
                              </div>
                              
                              {/* Session Title - truncated */}
                              <div className={`text-[10px] sm:text-xs text-center font-medium leading-tight line-clamp-2 ${
                                session.status === 'locked' ? 'text-gray-600' : 'text-white'
                              }`}>
                                {session.title.length > 15 ? `${session.title.substring(0, 12)}...` : session.title}
                              </div>
                              
                              {/* Special Mystery Badge */}
                              {isSpecialSession(session.sessionNumber) && (
                                <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white sm:border-2 flex items-center justify-center">
                                  {session.status === 'completed' ? (
                                    <motion.div
                                      className={`w-full h-full rounded-full flex items-center justify-center ${
                                        getSpecialSessionType(session.sessionNumber) === 'middle' 
                                          ? 'bg-gradient-to-br from-yellow-400 to-orange-400' 
                                          : 'bg-gradient-to-br from-purple-400 to-indigo-400'
                                      }`}
                                      animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360]
                                      }}
                                      transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      {getSpecialSessionType(session.sessionNumber) === 'middle' ? (
                                        <span className="text-xs">👑</span>
                                      ) : (
                                        <span className="text-xs">💎</span>
                                      )}
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full flex items-center justify-center"
                                      animate={{
                                        opacity: [0.6, 1, 0.6],
                                        scale: [0.8, 1, 0.8]
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      <span className="text-xs">❓</span>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                              
                              {/* Achievement Badge */}
                              {session.achievement && session.status === 'completed' && !isSpecialSession(session.sessionNumber) && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                  {session.achievement.icon === 'star' ? (
                                    <Star className="w-3 h-3 text-yellow-700 fill-current" />
                                  ) : (
                                    <Trophy className="w-3 h-3 text-yellow-700 fill-current" />
                                  )}
                                </div>
                              )}
                              
                              {/* Payment Status */}
                              {session.isPaid !== undefined && (
                                <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border border-white ${
                                  session.isPaid ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                              )}
                            </div>
                          </motion.div>
                        </div>

                        {/* Session Details Tooltip/Info on hover - for larger screens */}
                        <div className="hidden lg:block absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg min-w-max">
                            <div className="font-medium">{session.title}</div>
                            <div className="flex items-center space-x-2 mt-1 text-gray-300">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(session.date).toLocaleDateString('el-GR')}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{session.duration}</span>
                            </div>
                            {isSpecialSession(session.sessionNumber) && (
                              <div className="mt-1 text-cyan-300 text-xs">
                                {getSpecialSessionType(session.sessionNumber) === 'middle' ? '👑 Mystery Middle Session' : '💎 Final Mystery Session'}
                              </div>
                            )}
                            {session.achievement && !isSpecialSession(session.sessionNumber) && (
                              <div className="mt-1 text-yellow-300 text-xs">
                                🏆 {session.achievement.title}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout (4 columns) */}
          <div className="hidden sm:block space-y-6 sm:space-y-8">
            {Array.from({ length: numRowsDesktop }, (_, rowIndex) => (
              <div key={`desktop-${rowIndex}`} className="relative">
                <div className="grid grid-cols-4 gap-4 lg:gap-6">
                  {Array.from({ length: 4 }, (_, colIndex) => {
                    // Find which session should be in this position
                    const sessionIndex = sessions.findIndex((_, i) => {
                      const pos = getSnakePosition(i, 4);
                      return pos.row === rowIndex && pos.col === colIndex;
                    });
                    
                    if (sessionIndex === -1) {
                      return (
                        <div key={`desktop-empty-${rowIndex}-${colIndex}`} className="h-16 lg:h-20">
                          {/* Empty cell */}
                        </div>
                      );
                    }
                    
                    const session = sessions[sessionIndex];
                    const nextSession = sessions[sessionIndex + 1];
                    const connectionPath = nextSession ? getConnectionPath(sessionIndex, sessionIndex + 1, 4) : null;
                    
                    return (
                      <div key={session.id} className="relative">
                        {/* Outline/Connection to next session */}
                        {connectionPath && (
                          <div
                            className={`${connectionPath.className} ${getOutlineColor(session)} transition-colors duration-500 rounded-full`}
                          />
                        )}

                        {/* Session Card with outer outline effect */}
                        <div className="relative p-1 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                          {/* Outer glow effect */}
                          <div 
                            className={`absolute -inset-1 rounded-xl opacity-60 blur-sm transition-all duration-500 ${
                              isSpecialSession(session.sessionNumber) && session.status === 'completed'
                                ? getSpecialSessionType(session.sessionNumber) === 'middle' 
                                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                  : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                                : session.status === 'completed' 
                                ? 'bg-gradient-to-br from-emerald-400 to-blue-500' 
                                : session.status === 'available'
                                ? isSpecialSession(session.sessionNumber) 
                                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                                  : 'bg-gradient-to-br from-blue-400 to-purple-500'
                                : session.status === 'canceled'
                                ? 'bg-gradient-to-br from-red-400 to-red-500'
                                : 'bg-gray-200'
                            }`}
                          />
                          
                          {/* Main session card */}
                          <motion.div
                            className={`relative w-full h-16 lg:h-20 rounded-lg border-2 cursor-pointer transition-all duration-300 bg-gradient-to-br ${getStatusColor(session)} shadow-lg ${
                              session.status === 'locked' ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
                            }`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.05 * sessionIndex, duration: 0.5 }}
                            whileHover={session.status !== 'locked' ? { scale: 1.05 } : {}}
                            whileTap={session.status !== 'locked' ? { scale: 0.95 } : {}}
                            onClick={() => session.status !== 'locked' && onSessionClick?.(session)}
                          >
                            {/* Card Content */}
                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                              {/* Status Icon */}
                              <div className="mb-1">
                                {getStatusIcon(session)}
                              </div>
                              
                              {/* Session Title - truncated */}
                              <div className={`text-xs text-center font-medium leading-tight line-clamp-2 ${
                                session.status === 'locked' ? 'text-gray-600' : 'text-white'
                              }`}>
                                {session.title.length > 15 ? `${session.title.substring(0, 12)}...` : session.title}
                              </div>
                              
                              {/* Special Mystery Badge */}
                              {isSpecialSession(session.sessionNumber) && (
                                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                                  {session.status === 'completed' ? (
                                    <motion.div
                                      className={`w-full h-full rounded-full flex items-center justify-center ${
                                        getSpecialSessionType(session.sessionNumber) === 'middle' 
                                          ? 'bg-gradient-to-br from-yellow-400 to-orange-400' 
                                          : 'bg-gradient-to-br from-purple-400 to-indigo-400'
                                      }`}
                                      animate={{
                                        scale: [1, 1.2, 1],
                                        boxShadow: getSpecialSessionType(session.sessionNumber) === 'middle'
                                          ? ['0 0 0 rgba(251, 191, 36, 0)', '0 0 10px rgba(251, 191, 36, 0.6)', '0 0 0 rgba(251, 191, 36, 0)']
                                          : ['0 0 0 rgba(168, 85, 247, 0)', '0 0 10px rgba(168, 85, 247, 0.6)', '0 0 0 rgba(168, 85, 247, 0)']
                                      }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                      <span className="text-xs">
                                        {getSpecialSessionType(session.sessionNumber) === 'middle' ? '👑' : '💎'}
                                      </span>
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center"
                                      animate={{
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.9, 1, 0.9]
                                      }}
                                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                      <span className="text-xs text-gray-600">?</span>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                              
                              {/* Achievement Badge */}
                              {session.achievement && session.status === 'completed' && !isSpecialSession(session.sessionNumber) && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                  {session.achievement.icon === 'star' ? (
                                    <Star className="w-3 h-3 text-yellow-700 fill-current" />
                                  ) : (
                                    <Trophy className="w-3 h-3 text-yellow-700 fill-current" />
                                  )}
                                </div>
                              )}
                              
                              {/* Payment Status */}
                              {session.isPaid !== undefined && (
                                <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border border-white ${
                                  session.isPaid ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                              )}
                            </div>
                          </motion.div>
                        </div>

                        {/* Session Details Tooltip/Info on hover - for larger screens */}
                        <div className="hidden lg:block absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg min-w-max">
                            <div className="font-medium">{session.title}</div>
                            <div className="flex items-center space-x-2 mt-1 text-gray-300">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(session.date).toLocaleDateString('el-GR')}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{session.duration}</span>
                            </div>
                            {isSpecialSession(session.sessionNumber) && (
                              <div className="mt-1 text-cyan-300 text-xs">
                                {getSpecialSessionType(session.sessionNumber) === 'middle' ? '👑 Mystery Middle Session' : '💎 Final Mystery Session'}
                              </div>
                            )}
                            {session.achievement && !isSpecialSession(session.sessionNumber) && (
                              <div className="mt-1 text-yellow-300 text-xs">
                                🏆 {session.achievement.title}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Summary - Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-md">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 mb-1">
              {completedSessions}
            </div>
            <div className="text-sm font-medium text-emerald-700">Ολοκληρωμένες</div>
            <div className="text-xs text-emerald-600 mt-1">
              Σε όλες τις σελίδες
            </div>
          </div>
          
          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-md">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
              {(() => {
                const total = totalSessions || 0;
                return Math.max(0, total - completedSessions);
              })()}
            </div>
            <div className="text-sm font-medium text-blue-700">Υπολείπονται</div>
            <div className="text-xs text-blue-600 mt-1">
              Για ολοκλήρωση
            </div>
          </div>
          
          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-md">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 mb-1">
              {(() => {
                const total = totalSessions || 0;
                // Always show 2 mystery sessions (middle and final) if we have enough sessions
                return total >= 2 ? 2 : (total === 1 ? 1 : 0);
              })()}
            </div>
            <div className="text-sm font-medium text-purple-700">Μυστηριώδεις</div>
            <div className="text-xs text-purple-500 mt-1">
              {(() => {
                const total = totalSessions || 0;
                if (total >= 2) {
                  return `Συνεδρίες ${specialSessions.middle} & ${specialSessions.last}`;
                } else if (total === 1) {
                  return `Συνεδρία ${specialSessions.last}`;
                } else {
                  return 'Καμία';
                }
              })()}
            </div>
          </div>
        </div>

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-6 space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Δεν υπάρχουν συνεδρίες
            </h3>
            <p className="text-gray-500 text-sm">
              Οι συνεδρίες θα εμφανιστούν εδώ μόλις προγραμματιστούν
            </p>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
