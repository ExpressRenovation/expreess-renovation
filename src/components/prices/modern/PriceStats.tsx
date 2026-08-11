'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell, YAxis } from "recharts";
import { PriceBookItem } from "@/backend/price-book/domain/price-book-item";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceStatsProps {
    items: PriceBookItem[];
}

export function PriceStats({ items }: PriceStatsProps) {
    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            const ch = item.chapter || 'Uncategorized';
            counts[ch] = (counts[ch] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 chapters
    }, [items]);

    const COLORS = ['#3b82f6', '#4f46e5', '#8b5cf6', '#3b82f6', '#6366f1', '#8b5cf6', '#3b82f6', '#4f46e5', '#8b5cf6', '#3b82f6'];

    return (
        <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-card-foreground text-sm font-medium tracking-wide">Composition by Chapter</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 8)}..` : value}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
