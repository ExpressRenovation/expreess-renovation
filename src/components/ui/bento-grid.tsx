'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

/* ========================================
   BENTO GRID SYSTEM
   A flexible grid system for creating 
   Apple-style bento box layouts
   ======================================== */

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    columns?: 2 | 3 | 4;
}

export function BentoGrid({
    children,
    className,
    columns = 4,
    ...props
}: BentoGridProps) {
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div
            className={cn(
                'grid gap-4 md:gap-6',
                gridCols[columns],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/* ========================================
   BENTO CARD
   Individual card component with size 
   and variant options
   ======================================== */

type BentoSize = '1x1' | '1x2' | '2x1' | '2x2';

type BentoVariant =
    | 'default'
    | 'primary'
    | 'glass'
    | 'outline'
    | 'image'
    | 'dark'
    | 'gradient';

interface BentoCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    size?: BentoSize;
    variant?: BentoVariant;
    hover?: boolean;
    backgroundImage?: string;
}

export function BentoCard({
    children,
    className,
    size = '1x1',
    variant = 'default',
    hover = true,
    backgroundImage,
    ...props
}: BentoCardProps) {
    // Size classes for grid span
    const sizeClasses: Record<BentoSize, string> = {
        '1x1': 'col-span-1 row-span-1',
        '1x2': 'col-span-1 row-span-2',
        '2x1': 'col-span-1 md:col-span-2 row-span-1',
        '2x2': 'col-span-1 md:col-span-2 row-span-2',
    };

    // Variant styles
    const variantClasses: Record<BentoVariant, string> = {
        default: 'bg-card border border-border',
        primary: 'bg-primary text-primary-foreground',
        glass: 'glass',
        outline: 'bg-transparent border-2 border-primary',
        image: 'bg-cover bg-center bg-no-repeat',
        dark: 'bg-secondary text-secondary-foreground',
        gradient: 'gradient-gold text-primary-foreground',
    };

    // Hover effect classes
    const hoverClasses = hover
        ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20'
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
                'relative overflow-hidden rounded-2xl p-6',
                'min-h-[200px] md:min-h-[250px]',
                sizeClasses[size],
                variantClasses[variant],
                hoverClasses,
                className
            )}
            style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
            {...props}
        >
            {/* Overlay for image variant */}
            {variant === 'image' && backgroundImage && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            )}

            {/* Content wrapper */}
            <div className={cn(
                'relative z-10 h-full flex flex-col',
                variant === 'image' && 'text-white'
            )}>
                {children}
            </div>
        </motion.div>
    );
}

/* ========================================
   BENTO CARD SUBCOMPONENTS
   Composable parts for card content
   ======================================== */

interface BentoHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function BentoHeader({ children, className, ...props }: BentoHeaderProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    );
}

interface BentoTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
    as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function BentoTitle({
    children,
    className,
    as: Tag = 'h3',
    ...props
}: BentoTitleProps) {
    return (
        <Tag
            className={cn(
                'font-display text-xl md:text-2xl font-medium tracking-tight',
                className
            )}
            {...props}
        >
            {children}
        </Tag>
    );
}

interface BentoDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
}

export function BentoDescription({ children, className, ...props }: BentoDescriptionProps) {
    return (
        <p
            className={cn('text-sm md:text-base text-muted-foreground leading-relaxed', className)}
            {...props}
        >
            {children}
        </p>
    );
}

interface BentoContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function BentoContent({ children, className, ...props }: BentoContentProps) {
    return (
        <div className={cn('flex-1', className)} {...props}>
            {children}
        </div>
    );
}

interface BentoFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function BentoFooter({ children, className, ...props }: BentoFooterProps) {
    return (
        <div className={cn('mt-auto pt-4', className)} {...props}>
            {children}
        </div>
    );
}

/* ========================================
   BENTO ICON
   Icon wrapper with consistent styling
   ======================================== */

interface BentoIconProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'outline';
}

export function BentoIcon({
    children,
    className,
    variant = 'default',
    ...props
}: BentoIconProps) {
    const variantClasses = {
        default: 'bg-muted text-foreground',
        primary: 'bg-primary text-primary-foreground',
        outline: 'bg-transparent border-2 border-primary text-primary',
    };

    return (
        <div
            className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/* ========================================
   BENTO STAT
   For displaying numbers/statistics
   ======================================== */

interface BentoStatProps extends React.HTMLAttributes<HTMLDivElement> {
    value: React.ReactNode;
    label: string;
    suffix?: string;
}

export function BentoStat({
    value,
    label,
    suffix,
    className,
    ...props
}: BentoStatProps) {
    return (
        <div className={cn('text-center', className)} {...props}>
            <div className="font-display text-4xl md:text-5xl font-medium tracking-tight">
                {value}
                {suffix && <span className="text-primary">{suffix}</span>}
            </div>
            <div className="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                {label}
            </div>
        </div>
    );
}
