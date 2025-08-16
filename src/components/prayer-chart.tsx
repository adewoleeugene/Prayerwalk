
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartTooltipContent } from "@/components/ui/chart"

interface PrayerChartProps {
  data: {
    name: string;
    active: number;
    answered: number;
  }[];
}

export function PrayerChart({ data }: PrayerChartProps) {
  return (
    <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent />} 
                />
                <Bar dataKey="active" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="answered" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  )
}
