'use client';

import { Badge as BadgeType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface BadgeDisplayProps {
  badge: BadgeType;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  showImage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-200',
  rare: 'bg-blue-100 text-blue-800 border-blue-200',
  epic: 'bg-purple-100 text-purple-800 border-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const rarityGradients = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600',
};

export function BadgeDisplay({ 
  badge, 
  variant = 'default', 
  className,
  showImage = true,
  size = 'md',
  showDate = false
}: BadgeDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 sm:gap-3', className)}>
        {showImage && badge.image && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r overflow-hidden flex-shrink-0">
            <img 
              src={badge.image} 
              alt={badge.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate">{badge.name}</p>
          <Badge 
            className={cn('text-xs px-1 sm:px-2 py-0.5 sm:py-1', rarityColors[badge.rarity])}
            variant="outline"
          >
            {badge.rarity}
          </Badge>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            {showImage && (
              <div className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0',
                rarityGradients[badge.rarity]
              )}>
                {badge.image ? (
                  <img 
                    src={badge.image} 
                    alt={badge.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  badge.name.charAt(0).toUpperCase()
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-lg break-words">{badge.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                {badge.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
            <Badge className={cn('text-xs px-1 sm:px-2 py-0.5 sm:py-1', rarityColors[badge.rarity])}>
              {badge.rarity}
            </Badge>
            {badge.points && (
              <Badge variant="secondary" className="text-xs px-1 sm:px-2 py-0.5 sm:py-1">
                {badge.points} pts
              </Badge>
            )}
            {badge.maxToObtain && (
              <Badge variant="outline" className="text-xs px-1 sm:px-2 py-0.5 sm:py-1">
                Max: {badge.maxToObtain}
              </Badge>
            )}
          </div>
          {badge.earnedAt && (
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Earned: {formatDistanceToNow(new Date(badge.earnedAt), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {showImage && (
            <div className={cn(
              'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
              rarityGradients[badge.rarity]
            )}>
              {badge.image ? (
                <img 
                  src={badge.image} 
                  alt={badge.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                badge.name.charAt(0).toUpperCase()
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base break-words">{badge.name}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs sm:text-sm">
              {badge.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Badge className={cn('text-xs px-1 sm:px-2 py-0.5 sm:py-1', rarityColors[badge.rarity])}>
            {badge.rarity}
          </Badge>
          {badge.points && (
            <Badge variant="secondary" className="text-xs px-1 sm:px-2 py-0.5 sm:py-1">
              {badge.points} pts
            </Badge>
          )}
        </div>
        {showDate && badge.earnedAt && (
          <p className="text-xs text-muted-foreground mt-2 break-words">
            {formatDistanceToNow(new Date(badge.earnedAt), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Collection component for displaying multiple badges
interface BadgeCollectionProps {
  badges: BadgeType[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
}

export function BadgeCollection({ badges, maxDisplay = 12, size = 'md', showDate = false }: BadgeCollectionProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {displayBadges.map((badge) => (
          <BadgeDisplay 
            key={badge.id} 
            badge={badge} 
            size={size}
            showDate={showDate}
            className="w-full"
          />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            +{remainingCount} more badges
          </p>
        </div>
      )}
    </div>
  );
}