
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJournalStore } from '@/hooks/use-journal-store';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { JournalList } from '../journal/page';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const ChartTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-xs rounded-lg shadow-md bg-background/90 backdrop-blur-sm">
          <p className="font-bold">{`${label}`}</p>
          <p className="text-muted-foreground">{`Total Time: ${payload[0].value} min`}</p>
        </div>
      );
    }
    return null;
};
  
function PrayerActivityChart() {
    const { entries, isLoaded } = useJournalStore();
  
    const chartData = useMemo(() => {
      if (!isLoaded) return [];
  
      const weekStart = startOfDay(subDays(new Date(), 6));
      const weekEnd = startOfDay(new Date());
      const dateRange = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
      const prayerWalkEntries = entries.filter(e => e.sourceType === 'live' && e.duration);
  
      return dateRange.map(date => {
        const sessionsOnDate = prayerWalkEntries.filter(e => isSameDay(new Date(e.createdAt), date));
        const totalMinutes = Math.floor(sessionsOnDate.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
        return {
          name: format(date, 'eee'),
          total: totalMinutes,
        };
      });
    }, [entries, isLoaded]);
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Prayer Time</CardTitle>
          <CardDescription>Total minutes spent in Prayer Walks this week.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
              <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--secondary))'}} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
}

export function ActivityPage() {
  const router = useRouter();
  
  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline">My Activity</h1>
        <div className="w-10" />
      </header>
      <ScrollArea className="h-[calc(100vh-129px)] md:h-[calc(100vh-65px)]">
        <main className="p-4 md:p-6 space-y-6">
          <PrayerActivityChart />
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
