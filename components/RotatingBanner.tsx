"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Phone, MessageSquare } from 'lucide-react';

interface RotatingBannerProps {
  className?: string;
}

interface Banner {
  id: string;
  text: string;
  type: 'warning' | 'info' | 'contact';
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  icon: string;
  enabled: boolean;
}

export default function RotatingBanner({ className = "" }: RotatingBannerProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get icon component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle': return AlertTriangle;
      case 'Phone': return Phone;
      case 'MessageSquare': return MessageSquare;
      default: return MessageSquare;
    }
  };

  // Load banners from API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch('/api/admin/banners');
        const data = await response.json();
        
        if (data.success) {
          // Filter only enabled banners
          const enabledBanners = data.banners.filter((banner: Banner) => banner.enabled);
          setBanners(enabledBanners);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
        // Fallback to default banners
        setBanners([
          {
            id: 'default-1',
            text: 'Οι ακυρώσεις τελευταίας στιγμής χρεώνονται κανονικά',
            type: 'warning',
            bgColor: 'from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-800',
            iconColor: 'text-orange-600',
            icon: 'AlertTriangle',
            enabled: true
          },
          {
            id: 'default-2',
            text: 'Για οποιαδήποτε βοήθεια καλέστε μας στο: 96684911',
            type: 'contact',
            bgColor: 'from-blue-50 to-cyan-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-600',
            icon: 'Phone',
            enabled: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadBanners();
    }
  }, [mounted]);

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
    if (dismissed || !mounted || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [dismissed, mounted, banners.length]);

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('speechtrack-banner-dismissed', 'true');
  };

  // Don't render on server, if dismissed, or no banners
  if (!mounted || dismissed || banners.length === 0) {
    return null;
  }

  // Show loading if still loading
  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
      </div>
    );
  }

  const currentBanner = banners[currentMessage];
  const IconComponent = getIcon(currentBanner.icon);

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden rounded-lg border ${currentBanner.borderColor} bg-gradient-to-r ${currentBanner.bgColor} shadow-sm`}
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
              className={`flex-shrink-0 ${currentBanner.iconColor}`}
            >
              <IconComponent className="w-5 h-5" />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className={`${currentBanner.textColor} font-medium text-sm sm:text-base flex-1`}
              >
                <span>{currentBanner.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2 mx-4">
            {banners.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentMessage 
                    ? currentBanner.iconColor.replace('text-', 'bg-')
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
            className={`flex-shrink-0 w-8 h-8 p-0 hover:bg-white/50 ${currentBanner.textColor} hover:${currentBanner.textColor}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Rotating Animation Indicator */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 ${currentBanner.iconColor.replace('text-', 'bg-')} opacity-30`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          key={currentMessage}
        />
      </motion.div>
    </div>
  );
}
