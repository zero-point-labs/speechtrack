"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Save, Sparkles } from "lucide-react";
import { achievementService } from "@/lib/achievementService";

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

interface TrophyDesignerProps {
  currentTrophy: TrophyData;
  stepTitle: string;
  onSave: (trophyData: TrophyData) => void;
  onClose: () => void;
}

const TROPHY_ICONS = [
  "🏆", "🥇", "🥈", "🥉", "⭐", "🌟", "✨", "💫",
  "🎯", "🎪", "🎨", "🎵", "🏅", "🎊", "🎉", "👑",
  "💎", "🔥", "⚡", "🌈", "🎀", "🏵️", "🎖️", "🥳"
];

const ANIMATIONS = [
  { value: "confetti", label: "Confetti", description: "Colorful paper celebration" },
  { value: "fireworks", label: "Fireworks", description: "Explosive bursts of joy" },
  { value: "sparkles", label: "Sparkles", description: "Twinkling star effects" },
  { value: "glow", label: "Glow", description: "Radiant pulsing light" }
];

const TROPHY_COLORS = [
  { name: "Gold", bg: "#FFD700", glow: "#FFFFFF" },
  { name: "Silver", bg: "#C0C0C0", glow: "#E5E5E5" },
  { name: "Bronze", bg: "#CD7F32", glow: "#FFA500" },
  { name: "Diamond", bg: "#B9F2FF", glow: "#00CED1" },
  { name: "Ruby", bg: "#E0115F", glow: "#FF69B4" },
  { name: "Emerald", bg: "#50C878", glow: "#00FF00" },
  { name: "Sapphire", bg: "#0F52BA", glow: "#87CEEB" },
  { name: "Amethyst", bg: "#9966CC", glow: "#DDA0DD" }
];

export function TrophyDesigner({
  currentTrophy,
  stepTitle,
  onSave,
  onClose
}: TrophyDesignerProps) {
  const [trophy, setTrophy] = useState<TrophyData>(currentTrophy);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTrophyPresets();
  }, []);

  const loadTrophyPresets = async () => {
    try {
      setLoadingPresets(true);
      const library = await achievementService.getTrophyLibrary();
      setPresets(library);
    } catch (error) {
      console.error('Error loading trophy presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  const applyPreset = (preset: any) => {
    setTrophy({
      ...trophy,
      name: preset.name,
      icon: preset.icon,
      category: preset.category,
      animation: preset.defaultAnimation,
      backgroundColor: preset.backgroundColor,
      glowColor: preset.glowColor,
      unlockMessage: preset.defaultUnlockMessage || trophy.unlockMessage
    });
  };

  const applyColorScheme = (color: typeof TROPHY_COLORS[0]) => {
    setTrophy({
      ...trophy,
      backgroundColor: color.bg,
      glowColor: color.glow
    });
  };

  const handleSave = () => {
    onSave(trophy);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Trophy Designer</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              {/* Basic Settings */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Basic Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Trophy Name</label>
                    <Input
                      value={trophy.name}
                      onChange={(e) => setTrophy({ ...trophy, name: e.target.value })}
                      placeholder="e.g., Golden Achievement"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Unlock Message</label>
                    <Textarea
                      value={trophy.unlockMessage}
                      onChange={(e) => setTrophy({ ...trophy, unlockMessage: e.target.value })}
                      placeholder="Congratulations message..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Trophy Icon</h3>
                <div className="grid grid-cols-8 gap-2">
                  {TROPHY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      className={`w-10 h-10 rounded border-2 flex items-center justify-center hover:bg-gray-100 text-lg ${
                        trophy.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => setTrophy({ ...trophy, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Selection */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Celebration Animation</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ANIMATIONS.map((anim) => (
                    <button
                      key={anim.value}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        trophy.animation === anim.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setTrophy({ ...trophy, animation: anim.value })}
                    >
                      <div className="font-medium text-sm">{anim.label}</div>
                      <div className="text-xs text-gray-600">{anim.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Color Scheme</h3>
                <div className="grid grid-cols-4 gap-2">
                  {TROPHY_COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`p-2 border-2 rounded-lg flex flex-col items-center ${
                        trophy.backgroundColor === color.bg 
                          ? 'border-gray-800' 
                          : 'border-gray-300'
                      }`}
                      onClick={() => applyColorScheme(color)}
                    >
                      <div className="flex space-x-1 mb-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color.bg }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color.glow }}
                        />
                      </div>
                      <span className="text-xs">{color.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Custom Colors */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Background</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={trophy.backgroundColor}
                        onChange={(e) => setTrophy({ ...trophy, backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={trophy.backgroundColor}
                        onChange={(e) => setTrophy({ ...trophy, backgroundColor: e.target.value })}
                        className="text-xs"
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Glow</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={trophy.glowColor}
                        onChange={(e) => setTrophy({ ...trophy, glowColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={trophy.glowColor}
                        onChange={(e) => setTrophy({ ...trophy, glowColor: e.target.value })}
                        className="text-xs"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Preview and Presets */}
            <div className="space-y-6">
              {/* Live Preview */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Live Preview</h3>
                <div 
                  className="p-8 rounded-lg border-2 border-gray-200 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${trophy.backgroundColor}20, ${trophy.glowColor}20)`
                  }}
                >
                  <div className="text-6xl mb-3">{trophy.icon}</div>
                  <h4 className="font-bold text-lg mb-1">{trophy.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{stepTitle} Complete!</p>
                  <p className="text-sm">{trophy.unlockMessage}</p>
                  <Badge className="mt-3" variant="secondary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {trophy.animation} animation
                  </Badge>
                </div>
              </div>

              {/* Trophy Presets */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Trophy Presets</h3>
                {loadingPresets ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading presets...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {presets.map((preset) => (
                      <button
                        key={preset.$id}
                        className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left transition-all"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: preset.backgroundColor }}
                          >
                            {preset.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-gray-600">{preset.description}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {preset.rarity}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Trophy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
