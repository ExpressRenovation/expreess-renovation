'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/* ========================================
   PAGE TRANSITION PROVIDER
   Wraps the app to provide page transitions
   ======================================== */

interface PageTransitionProviderProps {
    children: React.ReactNode;
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname}>
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

/* ========================================
   PAGE TRANSITION
   Individual page wrapper with animations
   ======================================== */

type TransitionType = 'fade' | 'slide' | 'scale' | 'blur';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    transition?: TransitionType;
    duration?: number;
}

const transitionVariants = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slide: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    scale: {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.02 },
    },
    blur: {
        initial: { opacity: 0, filter: 'blur(10px)' },
        animate: { opacity: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, filter: 'blur(10px)' },
    },
};

export function PageTransition({
    children,
    className,
    transition = 'fade',
    duration = 0.3,
}: PageTransitionProps) {
    const variants = transitionVariants[transition];

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{
                duration,
                ease: [0.25, 0.4, 0.25, 1],
            }}
            className={cn('min-h-screen', className)}
        >
            {children}
        </motion.div>
    );
}

/* ========================================
   ROUTE TRANSITION LINK
   Link component with shared element transition
   (simulated using layout animations)
   ======================================== */

interface TransitionLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    layoutId?: string;
}

export function TransitionLink({
    href,
    children,
    className,
    layoutId,
}: TransitionLinkProps) {
    return (
        <motion.a
            href={href}
            className={cn('relative inline-block', className)}
            layoutId={layoutId}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {children}
        </motion.a>
    );
}

/* ========================================
   HERO TRANSITION
   Special hero section with dramatic entry
   ======================================== */

interface HeroTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function HeroTransition({ children, className }: HeroTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.8,
                ease: [0.25, 0.4, 0.25, 1],
            }}
            className={className}
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: 0.2,
                    ease: [0.25, 0.4, 0.25, 1],
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

/* ========================================
   LOADING TRANSITION
   Full-screen loading overlay
   ======================================== */

interface LoadingTransitionProps {
    isLoading: boolean;
}

export function LoadingTransition({ isLoading }: LoadingTransitionProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background"
                >
                    <motion.div
                        initial={{ scale: 1 }}
                        exit={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
