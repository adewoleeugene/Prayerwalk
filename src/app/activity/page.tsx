
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJournalStore } from '@/hooks/use-journal-store';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay, getDay, isToday } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { JournalList } from '../journal/page';
import { ArrowLeft, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
                        <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
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
    <div className="flex items-center gap-4">
        <Icon className="h-6 w-6 text-primary" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}
                {goal && <span className="text-sm font-normal text-muted-foreground">/{goal}</span>}
            </p>
        </div>
    </div>
);

export function ActivityPage() {
    const router = useRouter();
    const { entries, isLoaded: isJournalLoaded } = useJournalStore();
    const { prayers, categories, isLoaded: isPrayerLoaded } = usePrayerStore();

    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

    const weekDays = useMemo(() => {
        const end = startOfDay(new Date());
        const start = subDays(end, 6);
        return eachDayOfInterval({ start, end });
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
            return {
                time: `${i}:00`,
                label: i % 6 === 0 ? format(new Date().setHours(i), 'ha') : '',
                total: total,
            };
        });

        // Calculate stats for the whole week
        const weekPrayerWalks = entries.filter(e => e.sourceType === 'live' && e.duration && new Date(e.createdAt) >= weekDays[0]);
        const totalWeekMinutes = Math.floor(weekPrayerWalks.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
        
        const categoryCounts: { [key: string]: number } = {};
        weekPrayerWalks.forEach(entry => {
            if (entry.categoryId) {
                categoryCounts[entry.categoryId] = (categoryCounts[entry.categoryId] || 0) + (entry.duration || 0);
            }
        });
        
        const mostPrayedCategoryId = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, '');
        const mostPrayedCategory = categories.find(c => c.id === mostPrayedCategoryId)?.name || 'N/A';

        const currentWeeklySummary = {
            totalTime: totalWeekMinutes,
            mostPrayedCategory,
        }

        return { dailyStats: currentDailyStats, hourlyData: currentHourlyData, weeklySummary: currentWeeklySummary };

    }, [selectedDate, entries, prayers, categories, isJournalLoaded, isPrayerLoaded, weekDays]);

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold font-headline">My Activity</h1>
                <div className="w-10" />
            </header>
            <ScrollArea className="h-[calc(100vh-65px)]">
                <main className="p-4 md:p-6 space-y-6">
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                        <CarouselContent className="-ml-2">
                            {weekDays.map((day, index) => (
                                <CarouselItem key={index} className="pl-2 basis-1/5 md:basis-1/7">
                                    <div 
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
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                    <Card>
                        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                           <StatCard title="Prayers Added" value={dailyStats.prayersAdded?.toString() || '0'} icon={PlusCircle} />
                           <StatCard title="Prayer Time" value={dailyStats.prayerTime?.toString() || '0'} goal="60 min" icon={Clock} />
                           <StatCard title="Answered" value={dailyStats.answeredPrayers?.toString() || '0'} icon={CheckCircle} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 space-y-2">
                           <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Total Prayer Time (Week)</p>
                                <p className="font-bold">{weeklySummary.totalTime} min</p>
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
                        <h2 className="text-lg font-bold font-headline mb-2">Journal History</h2>
                        <JournalList />
                    </div>
                </main>
            </ScrollArea>
        </>
    );
}

export default ActivityPage;
