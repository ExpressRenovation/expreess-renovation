'use client';

import * as React from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ========================================
   ANIMATED SECTION
   Wrapper component with scroll-triggered
   animations using Framer Motion
   ======================================== */

// Animation variants
const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
};

const fadeDownVariants: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
};

const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const scaleInVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
};

const slideLeftVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
};

const slideRightVariants: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
};

const blurInVariants: Variants = {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
};

type AnimationType =
    | 'fadeUp'
    | 'fadeDown'
    | 'fadeIn'
    | 'scaleIn'
    | 'slideLeft'
    | 'slideRight'
    | 'blurIn';

const animationVariants: Record<AnimationType, Variants> = {
    fadeUp: fadeUpVariants,
    fadeDown: fadeDownVariants,
    fadeIn: fadeInVariants,
    scaleIn: scaleInVariants,
    slideLeft: slideLeftVariants,
    slideRight: slideRightVariants,
    blurIn: blurInVariants,
};

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    once?: boolean;
    amount?: number | 'some' | 'all';
    as?: keyof JSX.IntrinsicElements;
}

export function AnimatedSection({
    children,
    className,
    animation = 'fadeUp',
    delay = 0,
    duration = 0.6,
    once = true,
    amount = 0.2,
    as = 'section',
}: AnimatedSectionProps) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once, amount });

    const Component = motion[as as keyof typeof motion] as React.ComponentType<any>;

    return (
        <Component
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={animationVariants[animation]}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.4, 0.25, 1], // custom easing
            }}
            className={className}
        >
            {children}
        </Component>
    );
}

/* ========================================
   STAGGER CONTAINER
   Container that staggers children animations
   ======================================== */

interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    once = true,
}: StaggerContainerProps) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once, amount: 0.2 });

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: staggerDelay,
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={containerVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ========================================
   STAGGER ITEM
   Individual item within StaggerContainer
   ======================================== */

interface StaggerItemProps {
    children: React.ReactNode;
    className?: string;
    animation?: AnimationType;
}

export function StaggerItem({
    children,
    className,
    animation = 'fadeUp',
}: StaggerItemProps) {
    return (
        <motion.div
            variants={animationVariants[animation]}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ========================================
   PARALLAX SECTION
   Section with parallax scroll effect
   ======================================== */

interface ParallaxSectionProps {
    children: React.ReactNode;
    className?: string;
    speed?: number; // 0-1, where 0.5 is half speed
    direction?: 'up' | 'down';
}

export function ParallaxSection({
    children,
    className,
    speed = 0.3,
    direction = 'up',
}: ParallaxSectionProps) {
    const ref = React.useRef(null);
    const [scrollY, setScrollY] = React.useState(0);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const yOffset = direction === 'up' ? scrollY * speed * -1 : scrollY * speed;

    return (
        <div ref={ref} className={cn('relative overflow-hidden', className)}>
            <motion.div
                style={{ y: yOffset }}
                transition={{ type: 'tween', ease: 'linear' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

/* ========================================
   TEXT REVEAL
   Character-by-character text reveal
   ======================================== */

interface TextRevealProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
}

export function TextReveal({
    text,
    className,
    delay = 0,
    duration = 0.05,
}: TextRevealProps) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    const words = text.split(' ');

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: duration,
                delayChildren: delay,
            },
        },
    };

    const wordVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.span
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={containerVariants}
            className={cn('inline-flex flex-wrap', className)}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={wordVariants}
                    transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                    className="mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
}

/* ========================================
   COUNTER ANIMATION
   Animated number counter
   ======================================== */

interface CounterProps {
    from?: number;
    to: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}

export function Counter({
    from = 0,
    to,
    duration = 2,
    suffix = '',
    prefix = '',
    className,
}: CounterProps) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = React.useState(from);

    React.useEffect(() => {
        if (!isInView) return;

        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        const tick = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (endTime - startTime), 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(from + (to - from) * eased));

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [isInView, from, to, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{count}{suffix}
        </span>
    );
}
