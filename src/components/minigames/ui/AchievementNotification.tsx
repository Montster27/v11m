// /Users/montysharma/V11M2/src/components/minigames/ui/AchievementNotification.tsx
// Achievement notification system

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
  autoHideDelay?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
  autoHideDelay = 5000
}) => {
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'showing' | 'celebrating' | 'exiting'>('entering');

  useEffect(() => {
    if (isVisible && achievement) {
      setAnimationPhase('entering');
      
      // Entrance animation
      const enterTimeout = setTimeout(() => {
        setAnimationPhase('showing');
      }, 100);

      // Celebration phase
      const celebrateTimeout = setTimeout(() => {
        setAnimationPhase('celebrating');
      }, 500);

      // End celebration
      const endCelebrateTimeout = setTimeout(() => {
        setAnimationPhase('showing');
      }, 1500);

      // Auto-hide
      const hideTimeout = setTimeout(() => {
        handleClose();
      }, autoHideDelay);

      return () => {
        clearTimeout(enterTimeout);
        clearTimeout(celebrateTimeout);
        clearTimeout(endCelebrateTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [isVisible, achievement, autoHideDelay]);

  const handleClose = () => {
    setAnimationPhase('exiting');
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!achievement || !isVisible) {
    return null;
  }

  const getRarityConfig = (rarity: Achievement['rarity'] = 'common') => {
    const configs = {
      common: {
        gradient: 'from-green-400 to-green-600',
        glow: 'shadow-green-400/50',
        icon: '🏆',
        particle: '✨'
      },
      rare: {
        gradient: 'from-blue-400 to-blue-600',
        glow: 'shadow-blue-400/50',
        icon: '🎖️',
        particle: '💫'
      },
      epic: {
        gradient: 'from-purple-400 to-purple-600',
        glow: 'shadow-purple-400/50',
        icon: '👑',
        particle: '⭐'
      },
      legendary: {
        gradient: 'from-yellow-400 to-orange-500',
        glow: 'shadow-yellow-400/50',
        icon: '🌟',
        particle: '🔥'
      }
    };
    return configs[rarity];
  };

  const rarityConfig = getRarityConfig(achievement.rarity);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (animationPhase) {
      case 'entering':
        return `${baseClasses} translate-y-full opacity-0 scale-95`;
      case 'showing':
        return `${baseClasses} translate-y-0 opacity-100 scale-100`;
      case 'celebrating':
        return `${baseClasses} translate-y-0 opacity-100 scale-110 ${rarityConfig.glow} shadow-2xl`;
      case 'exiting':
        return `${baseClasses} translate-y-full opacity-0 scale-95`;
      default:
        return baseClasses;
    }
  };

  // Particle animation component
  const Particles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`absolute text-lg animate-bounce ${
            animationPhase === 'celebrating' ? 'animate-pulse' : ''
          }`}
          style={{
            left: `${20 + (i * 10)}%`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '1s'
          }}
        >
          {rarityConfig.particle}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <Card className={`
        relative overflow-hidden pointer-events-auto max-w-sm
        ${getAnimationClasses()}
        border-0 bg-gradient-to-r ${rarityConfig.gradient}
        text-white shadow-xl
      `}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Particles */}
        {animationPhase === 'celebrating' && <Particles />}

        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={`text-3xl flex-shrink-0 ${
              animationPhase === 'celebrating' ? 'animate-spin' : ''
            }`}>
              {achievement.icon || rarityConfig.icon}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg leading-tight">
                  Achievement Unlocked!
                </h3>
                <button
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors ml-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="font-medium text-white/95 mb-1">
                {achievement.name}
              </div>
              
              <div className="text-sm text-white/80 leading-relaxed">
                {achievement.description}
              </div>

              {/* Rarity Badge */}
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white/20 rounded-full capitalize">
                  {achievement.rarity || 'common'} achievement
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar Animation */}
          <div className="mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-white/80 rounded-full transition-all duration-2000 ease-out"
              style={{ 
                width: animationPhase === 'entering' ? '0%' : '100%',
                transitionDelay: '200ms'
              }}
            />
          </div>
        </div>

        {/* Shine Effect */}
        {animationPhase === 'celebrating' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse" />
        )}
      </Card>
    </div>
  );
};

export default AchievementNotification;