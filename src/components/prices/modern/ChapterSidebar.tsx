'use client';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ChapterSidebarProps {
    chapters: Record<string, number>;
    selectedChapter: string;
    onSelect: (chapter: string) => void;
    totalItems: number;
}

export function ChapterSidebar({ chapters, selectedChapter, onSelect, totalItems }: ChapterSidebarProps) {
    const sortedChapters = Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="border-r border-sidebar-border bg-sidebar flex flex-col h-full w-full">
            <div className="p-4 border-b border-sidebar-border">
                <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Chapters</h3>
                <button
                    onClick={() => onSelect('All')}
                    className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                        selectedChapter === 'All'
                            ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                >
                    All Items
                    <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full bg-sidebar-accent text-muted-foreground transition-colors",
                        selectedChapter === 'All' && "bg-sidebar-primary/20 text-sidebar-primary"
                    )}>
                        {totalItems}
                    </span>
                </button>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
                <div className="space-y-1">
                    {sortedChapters.map(([name, count], index) => {
                        // Truncate long names slightly or handle wrapping
                        // e.g. "ACRISTALAMIENTOS" -> "ACRISTALAMIENTOS"
                        if (!name) return null;

                        const isSelected = selectedChapter === name;

                        return (
                            <button
                                key={name}
                                onClick={() => onSelect(name)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-between group relative overflow-hidden",
                                    isSelected
                                        ? "text-sidebar-foreground bg-sidebar-accent shadow-inner"
                                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-sidebar-primary"
                                    />
                                )}
                                <span className="truncate pr-2">{name}</span>
                                <span className={cn(
                                    "hidden group-hover:inline-block text-[10px] text-muted-foreground/60",
                                    isSelected && "inline-block text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
