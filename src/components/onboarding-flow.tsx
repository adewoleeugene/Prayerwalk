"use client";

import React, { useState } from 'react';
import { useOnboardingStore, UserGoal, OnboardingPreferences } from '@/hooks/use-onboarding-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Clock, 
  Heart, 
  Users, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const TooltipWrapper: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1">
          {children}
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center mb-6">
      <Logo />
    </div>
    <div className="space-y-4">
      <h1 className="text-3xl font-bold font-headline">Welcome to PraySmart</h1>
      <p className="text-lg text-muted-foreground max-w-md mx-auto">
        Let's personalize your prayer journey and help you build meaningful spiritual habits.
      </p>
    </div>
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
        <Target className="h-8 w-8 text-primary mb-2" />
        <span className="text-sm font-medium">Set Goals</span>
      </div>
      <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
        <Heart className="h-8 w-8 text-primary mb-2" />
        <span className="text-sm font-medium">Track Progress</span>
      </div>
    </div>
    <Button onClick={onNext} size="lg" className="w-full max-w-xs">
      Get Started
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
);



const GoalsStep: React.FC<{
  goals: UserGoal[];
  onAddGoal: (goal: Omit<UserGoal, 'id' | 'createdAt'>) => void;
  onRemoveGoal: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ goals, onAddGoal, onRemoveGoal, onNext, onBack }) => {
  const [newGoal, setNewGoal] = useState<Omit<UserGoal, 'id' | 'createdAt'>>({
    title: 'Prayer Goal',
    description: '',
    targetValue: 15,
    targetUnit: 'minutes',
    timeframe: 'daily',
    isActive: true
  });







  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-headline">Create Your Goals</h2>
        <p className="text-muted-foreground">
          Set measurable targets to track your spiritual progress
        </p>
      </div>



      {/* Goal Configuration */}
      <div className="space-y-4">
        <TooltipWrapper content="Set your prayer target to track your spiritual progress.">
          <Label className="text-base font-medium">Set Your Prayer Target</Label>
        </TooltipWrapper>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="goal-target">Target</Label>
            <Input
              id="goal-target"
              type="number"
              min="1"
              value={newGoal.targetValue}
              onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-unit">Unit</Label>
            <Select 
              value={newGoal.targetUnit} 
              onValueChange={(value) => setNewGoal({ ...newGoal, targetUnit: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="prayers">Prayers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-timeframe">Timeframe</Label>
            <Select 
              value={newGoal.timeframe} 
              onValueChange={(value) => setNewGoal({ ...newGoal, timeframe: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>



      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => {
          // Automatically add the configured goal when continuing
          if (goals.length === 0) {
            onAddGoal({ ...newGoal, isActive: true });
          }
          onNext();
        }}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const PreferencesStep: React.FC<{
  preferences: OnboardingPreferences;
  onUpdate: (updates: Partial<OnboardingPreferences>) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ preferences, onUpdate, onNext, onBack }) => {
  const prayerTimes = [
    { id: 'morning', title: 'Morning', description: '6:00 AM - 12:00 PM' },
    { id: 'afternoon', title: 'Afternoon', description: '12:00 PM - 6:00 PM' },
    { id: 'evening', title: 'Evening', description: '6:00 PM - 12:00 AM' },
    { id: 'flexible', title: 'Flexible', description: 'No specific time preference' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-headline">Customize Your Experience</h2>
        <p className="text-muted-foreground">
          These preferences help us personalize your prayer journey
        </p>
      </div>

      <div className="space-y-4">
        <TooltipWrapper content="Choose when you typically prefer to pray. This helps us send relevant reminders and suggestions.">
          <Label className="text-base font-medium">Preferred Prayer Time</Label>
        </TooltipWrapper>
        
        <RadioGroup 
          value={preferences.preferredPrayerTime} 
          onValueChange={(value) => onUpdate({ preferredPrayerTime: value as any })}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {prayerTimes.map((time) => (
            <div key={time.id} className="flex items-center space-x-2">
              <RadioGroupItem value={time.id} id={time.id} />
              <div className="flex-1">
                <Label htmlFor={time.id} className="font-medium cursor-pointer">
                  {time.title}
                </Label>
                <p className="text-xs text-muted-foreground">{time.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <TooltipWrapper content="Receive gentle reminders and encouragement to help maintain your prayer habits.">
              <Label className="text-base font-medium">Prayer Reminders</Label>
            </TooltipWrapper>
            <p className="text-sm text-muted-foreground">
              Get notifications to help maintain your prayer routine
            </p>
          </div>
          <Switch
            checked={preferences.notificationsEnabled}
            onCheckedChange={(checked) => onUpdate({ notificationsEnabled: checked })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-primary" />
      </div>
    </div>
    
    <div className="space-y-4">
      <h2 className="text-3xl font-bold font-headline">You're All Set!</h2>
      <p className="text-lg text-muted-foreground max-w-md mx-auto">
        Your prayer journey is now personalized and ready to begin. Let's start building meaningful spiritual habits together.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
      <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
        <Target className="h-6 w-6 text-primary mb-2" />
        <span className="text-sm font-medium">Goals Set</span>
      </div>
      <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
        <Heart className="h-6 w-6 text-primary mb-2" />
        <span className="text-sm font-medium">Preferences Saved</span>
      </div>
      <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
        <Sparkles className="h-6 w-6 text-primary mb-2" />
        <span className="text-sm font-medium">Ready to Pray</span>
      </div>
    </div>
    
    <Button onClick={onComplete} size="lg" className="w-full max-w-xs">
      Start My Prayer Journey
    </Button>
  </div>
);

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const {
    currentStep,
    steps,
    goals,
    preferences,
    setCurrentStep,
    completeStep,
    completeOnboarding,
    addGoal,
    removeGoal,
    updatePreferences
  } = useOnboardingStore();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    const currentStepData = steps[currentStep];
    completeStep(currentStepData.id);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const renderStep = () => {
    const stepId = steps[currentStep]?.id;
    
    switch (stepId) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;

      case 'goals':
        return (
          <GoalsStep
            goals={goals}
            onAddGoal={addGoal}
            onRemoveGoal={removeGoal}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'preferences':
        return (
          <PreferencesStep
            preferences={preferences}
            onUpdate={updatePreferences}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'complete':
        return <CompleteStep onComplete={() => { completeOnboarding(); onComplete(); }} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
          {/* Skip Button - only show on steps other than welcome and complete */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="px-8 pb-4">
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip setup for now
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};