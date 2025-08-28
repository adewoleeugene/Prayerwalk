"use client";

import React, { useEffect, useState } from 'react';
import { useStreakStore } from '@/hooks/use-streak-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Flame, Calendar, Trophy, CheckCircle, Circle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface StreakCounterProps {
  className?: string;
  compact?: boolean;
  collapsible?: boolean;
  linkToActivities?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ 
  className, 
  compact = false, 
  collapsible = false, 
  linkToActivities = false 
}) => {
  const { streakData, isLoaded, getRecentHistory } = useStreakStore();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStreak, setPrevStreak] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  
  const recentHistory = getRecentHistory(7);
  
  // Handler functions
  const handleNavigateToActivities = () => {
    if (linkToActivities) {
      router.push('/activity');
    }
  };
  
  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Animate when streak increases
  useEffect(() => {
    if (isLoaded && streakData.currentStreak > prevStreak) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevStreak(streakData.currentStreak);
  }, [streakData.currentStreak, isLoaded, prevStreak]);
  
  if (!isLoaded) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          <Flame className={cn(
            "h-5 w-5 transition-colors duration-300",
            streakData.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-bold text-lg transition-all duration-300",
            isAnimating && "scale-110 text-orange-500"
          )}>
            {streakData.currentStreak}
          </span>
        </div>
        <div className="flex gap-1">
          {recentHistory.slice(-3).map((day, index) => (
            <div
              key={day.date}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                day.completed ? "bg-green-500" : "bg-muted",
                isToday(parseISO(day.date)) && "ring-2 ring-primary ring-offset-1"
              )}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isAnimating && "ring-2 ring-orange-500 ring-opacity-50",
        linkToActivities && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={handleNavigateToActivities}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className={cn(
              "h-6 w-6 transition-colors duration-300",
              streakData.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
            <h3 className="font-semibold text-lg">Prayer Streak</h3>
            {linkToActivities && (
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {streakData.longestStreak > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Best: {streakData.longestStreak}
              </Badge>
            )}
            {collapsible && (
              <button
                onClick={handleToggleExpanded}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Main Streak Display */}
        <div className="text-center mb-6">
          <div className={cn(
            "text-4xl font-bold transition-all duration-300 mb-2",
            isAnimating && "scale-110 text-orange-500",
            streakData.currentStreak > 0 ? "text-foreground" : "text-muted-foreground"
          )}>
            {streakData.currentStreak}
          </div>
          <p className="text-sm text-muted-foreground">
            {streakData.currentStreak === 0 ? "Start your streak today!" :
             streakData.currentStreak === 1 ? "day in a row" :
             "days in a row"}
          </p>
        </div>
        
        {/* Collapsible Content */}
        {isExpanded && (
          <>
            {/* Today's Status */}
        <div className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-lg mb-4 transition-colors duration-200",
          streakData.todayCompleted ? "bg-green-50 border border-green-200" : "bg-muted/50"
        )}>
          {streakData.todayCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
          <span className={cn(
            "font-medium",
            streakData.todayCompleted ? "text-green-700" : "text-muted-foreground"
          )}>
            {streakData.todayCompleted ? "Today completed!" : "Complete today's prayer"}
          </span>
        </div>
        
        {/* Weekly History */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last 7 days</span>
          </div>
          <div className="flex gap-1 justify-between">
            {recentHistory.map((day, index) => {
              const dayDate = parseISO(day.date);
              const isCurrentDay = isToday(dayDate);
              
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                    day.completed 
                      ? "bg-green-500 border-green-500 text-white" 
                      : "bg-muted border-muted-foreground/20",
                    isCurrentDay && "ring-2 ring-primary ring-offset-2",
                    isAnimating && day.completed && isCurrentDay && "animate-pulse"
                  )}>
                    {day.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs",
                    isCurrentDay ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {format(dayDate, 'EEE').slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
            {/* Motivational Message */}
            {streakData.currentStreak > 0 && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-center text-primary font-medium">
                  {streakData.currentStreak >= 7 ? "🔥 Amazing dedication! Keep it up!" :
                   streakData.currentStreak >= 3 ? "💪 Great momentum building!" :
                   "🌟 You're on a roll!"}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Animated Background Effect */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 animate-pulse pointer-events-none" />
      )}
    </Card>
  );
};

export default StreakCounter;