
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJournalStore } from '@/hooks/use-journal-store';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { JournalList } from '../journal/page';
import { ArrowLeft, CheckCircle, Clock, PlusCircle, ChevronLeft, ChevronRight, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { View } from '@/app/page';


const ChartTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 text-xs rounded-lg shadow-md bg-background/90 backdrop-blur-sm">
          <p className="font-bold">{`${data.time}`}</p>
          <p className="text-muted-foreground">{`Prayer Time: ${data.total} min`}</p>
        </div>
      );
    }
    return null;
};

function PrayerActivityChart({ hourlyData }: { hourlyData: any[] }) {
    const [focusBar, setFocusBar] = useState<number | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Hourly Prayer Time</CardTitle>
                <CardDescription>Time spent in prayer walks throughout the day.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart 
                        data={hourlyData} 
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        onMouseMove={(state) => {
                            if (state.isTooltipActive) {
                              setFocusBar(state.activeTooltipIndex!);
                            } else {
                              setFocusBar(null);
                            }
                        }}
                    >
                        <XAxis 
                            dataKey="label" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                        <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--secondary))'}} />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                            {hourlyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={focusBar === index ? 'hsl(var(--primary))' : 'hsl(var(--primary), 0.5)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

const StatCard = ({ title, value, goal, icon: Icon }: { title: string, value: string, goal?: string, icon: React.ElementType }) => (
    <div className="flex flex-col items-center text-center gap-2">
        <Icon className="h-8 w-8 text-primary" />
        <div>
            <p className="text-2xl font-bold">{value}
                {goal && <span className="text-sm font-normal text-muted-foreground">/{goal}</span>}
            </p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    </div>
);

export function ActivityPage({ setView }: { setView: (view: View) => void; }) {
    const { entries, isLoaded: isJournalLoaded } = useJournalStore();
    const { prayers, categories, goal, setGoal, isLoaded: isPrayerLoaded } = usePrayerStore();
    const { toast } = useToast();

    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

    const [dailyGoal, setDailyGoal] = useState(goal.dailyPrayerTime);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isPrayerLoaded) {
          setDailyGoal(goal.dailyPrayerTime);
        }
    }, [isPrayerLoaded, goal.dailyPrayerTime]);

    const handleSaveChanges = () => {
        setIsSaving(true);
        setGoal({ dailyPrayerTime: Number(dailyGoal) });
        setTimeout(() => {
          toast({
            title: "Settings Saved",
            description: "Your prayer goal has been updated.",
          });
          setIsSaving(false);
        }, 500);
    };

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const goToPreviousWeek = useCallback(() => {
        setCurrentDate(prev => subWeeks(prev, 1));
    }, []);

    const goToNextWeek = useCallback(() => {
        setCurrentDate(prev => addWeeks(prev, 1));
    }, []);

    const { dailyStats, hourlyData, weeklySummary } = useMemo(() => {
        if (!isJournalLoaded || !isPrayerLoaded) return { dailyStats: {}, hourlyData: [], weeklySummary: {} };

        // Calculate stats for the selected day
        const dayPrayers = prayers.filter(p => isSameDay(new Date(p.createdAt), selectedDate));
        const dayAnswered = prayers.filter(p => p.status === 'answered' && isSameDay(new Date(p.createdAt), selectedDate));
        const dayPrayerWalks = entries.filter(e => e.sourceType === 'live' && e.duration && isSameDay(new Date(e.createdAt), selectedDate));
        const totalMinutes = Math.floor(dayPrayerWalks.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);

        const currentDailyStats = {
            prayersAdded: dayPrayers.length,
            prayerTime: totalMinutes,
            answeredPrayers: dayAnswered.length,
        };
        
        // Calculate hourly breakdown for the selected day
        const currentHourlyData = Array.from({ length: 24 }, (_, i) => {
            const sessionsInHour = dayPrayerWalks.filter(e => new Date(e.createdAt).getHours() === i);
            const total = Math.floor(sessionsInHour.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
            let label = '';
            if (i === 0) label = '12am';
            else if (i === 6) label = '6am';
            else if (i === 12) label = '12pm';
            else if (i === 18) label = '6pm';
            
            return {
                time: format(new Date(2000, 0, 1, i), 'h a'),
                label: label,
                total: total,
            };
        });

        // Calculate stats for the whole week
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        const weekPrayerWalks = entries.filter(e => {
            const entryDate = new Date(e.createdAt);
            return e.sourceType === 'live' && e.duration && entryDate >= weekStart && entryDate <= weekEnd;
        });

        const totalWeekMinutes = Math.floor(weekPrayerWalks.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
        
        const categoryCounts: { [key: string]: number } = {};
        weekPrayerWalks.forEach(entry => {
            if (entry.categoryId) {
                categoryCounts[entry.categoryId] = (categoryCounts[entry.categoryId] || 0) + (entry.duration || 0);
            }
        });
        
        const mostPrayedCategoryId = Object.keys(categoryCounts).length > 0
            ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
            : '';
        const mostPrayedCategory = categories.find(c => c.id === mostPrayedCategoryId)?.name || 'N/A';
        
        const weeklyGoal = (goal.dailyPrayerTime || 0) * 7;
        
        const currentWeeklySummary = {
            totalTime: totalWeekMinutes,
            mostPrayedCategory,
            weeklyGoal: weeklyGoal,
        }

        return { dailyStats: currentDailyStats, hourlyData: currentHourlyData, weeklySummary: currentWeeklySummary };

    }, [selectedDate, entries, prayers, categories, isJournalLoaded, isPrayerLoaded, currentDate, goal]);

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => setView({ type: 'home' })}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold font-headline">My Activity</h1>
                <div className="w-10" />
            </header>
            <ScrollArea className="h-[calc(100vh-65px)]">
                <main className="p-4 md:p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                            <ChevronLeft />
                        </Button>
                        <div className="text-center font-semibold">
                            {format(currentDate, 'MMMM yyyy')}
                        </div>
                        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                            <ChevronRight />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                        {weekDays.map((day) => (
                            <div 
                                key={day.toString()}
                                className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                                onClick={() => setSelectedDate(day)}
                            >
                                <p className="text-sm text-muted-foreground">{format(day, 'E')}</p>
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-2",
                                    isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground border-primary" : "border-transparent",
                                    isToday(day) && !isSameDay(day, selectedDate) && "border-primary/50"
                                )}>
                                    <p className="font-bold">{format(day, 'd')}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="p-4 flex flex-wrap items-center justify-around gap-4">
                           <StatCard title="Prayers Added" value={dailyStats.prayersAdded?.toString() || '0'} icon={PlusCircle} />
                           <StatCard title="Prayer Time" value={`${dailyStats.prayerTime?.toString() || '0'}`} goal={`${goal.dailyPrayerTime} min`} icon={Clock} />
                           <StatCard title="Answered" value={dailyStats.answeredPrayers?.toString() || '0'} icon={CheckCircle} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Set Your Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="daily-goal">Daily Prayer Time (minutes)</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="daily-goal" 
                                        type="number" 
                                        value={dailyGoal}
                                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                                        placeholder="e.g., 30"
                                        min="1"
                                    />
                                    <Button onClick={handleSaveChanges} disabled={isSaving || !isPrayerLoaded}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                           <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Total Prayer Time (Week)</p>
                                <p className="font-bold">{weeklySummary.totalTime} min
                                    {weeklySummary.weeklyGoal > 0 && <span className="text-sm font-normal text-muted-foreground"> / {weeklySummary.weeklyGoal} min</span>}
                                </p>
                           </div>
                           <Separator />
                           <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Most Prayed Category</p>
                                <p className="font-bold">{weeklySummary.mostPrayedCategory}</p>
                           </div>
                        </CardContent>
                    </Card>

                    <PrayerActivityChart hourlyData={hourlyData} />
                    
                    <div>
                        <h2 className="text-lg font-bold font-headline mb-2">Journal History for {format(selectedDate, 'MMMM d')}</h2>
                        <JournalList filterDate={selectedDate} />
                    </div>
                </main>
            </ScrollArea>
        </>
    );
}

export default ActivityPage;
