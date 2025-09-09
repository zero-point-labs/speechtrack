"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Phone } from 'lucide-react';

interface RotatingBannerProps {
  className?: string;
}

export default function RotatingBanner({ className = "" }: RotatingBannerProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Messages to rotate between
  const messages: Array<{
    id: number;
    text: string;
    phoneNumber?: string;
    icon: React.ComponentType<any>;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }> = [
    {
      id: 1,
      text: "Οι ακυρώσεις τελευταίας στιγμής χρεώνονται κανονικά",
      icon: AlertTriangle,
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      iconColor: "text-orange-600"
    },
    {
      id: 2,
      text: "Για οποιαδήποτε βοήθεια καλέστε μας στο:",
      phoneNumber: "96684911",
      icon: Phone,
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-600"
    }
  ];

  // Check if banner was previously dismissed
  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem('speechtrack-banner-dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // Auto-rotate messages every 5 seconds
  useEffect(() => {
    if (dismissed || !mounted) return;

    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [dismissed, mounted, messages.length]);

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('speechtrack-banner-dismissed', 'true');
  };

  // Don't render on server or if dismissed
  if (!mounted || dismissed) {
    return null;
  }

  const currentMsg = messages[currentMessage];

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden rounded-lg border ${currentMsg.borderColor} bg-gradient-to-r ${currentMsg.bgColor} shadow-sm`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 2px, transparent 2px)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative flex items-center justify-between p-4">
          {/* Message Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              key={currentMessage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex-shrink-0 ${currentMsg.iconColor}`}
            >
              <currentMsg.icon className="w-5 h-5" />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className={`${currentMsg.textColor} font-medium text-sm sm:text-base flex-1`}
              >
                <span>{currentMsg.text}</span>
                {currentMsg.phoneNumber && (
                  <a
                    href={`tel:${currentMsg.phoneNumber}`}
                    className={`ml-2 underline hover:no-underline transition-all duration-200 font-bold ${currentMsg.iconColor} hover:scale-105 inline-block`}
                  >
                    {currentMsg.phoneNumber}
                  </a>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2 mx-4">
            {messages.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentMessage 
                    ? currentMsg.iconColor.replace('text-', 'bg-')
                    : 'bg-gray-300'
                }`}
                animate={{
                  scale: index === currentMessage ? 1.2 : 1
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={`flex-shrink-0 w-8 h-8 p-0 hover:bg-white/50 ${currentMsg.textColor} hover:${currentMsg.textColor}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Rotating Animation Indicator */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 ${currentMsg.iconColor.replace('text-', 'bg-')} opacity-30`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          key={currentMessage}
        />
      </motion.div>
    </div>
  );
}
