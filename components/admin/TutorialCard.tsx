"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  title: string;
  description: string;
  action?: string;
}

interface TutorialCardProps {
  title: string;
  description: string;
  steps: TutorialStep[];
  className?: string;
  defaultExpanded?: boolean;
}

export default function TutorialCard({ 
  title, 
  description, 
  steps, 
  className = "",
  defaultExpanded = false 
}: TutorialCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-6 ${className}`}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-full bg-blue-100 mt-0.5">
                <Lightbulb className="w-4 h-4 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-blue-900">
                    {title}
                  </h3>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 text-blue-600 hover:bg-blue-100"
                  >
                    {isExpanded ? 
                      <ChevronUp className="w-3 h-3" /> : 
                      <ChevronDown className="w-3 h-3" />
                    }
                  </Button>
                </div>
                
                <p className="text-xs text-blue-800 leading-relaxed mb-2">
                  {description}
                </p>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 border-t border-blue-200 mt-2">
                        <div className="space-y-3">
                          {steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-medium text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-blue-900">
                                  {step.title}
                                </p>
                                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                                  {step.description}
                                </p>
                                {step.action && (
                                  <p className="text-xs text-blue-600 mt-1 italic">
                                    💡 {step.action}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <Button
              onClick={() => setIsDismissed(true)}
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-blue-500 hover:bg-blue-100 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
