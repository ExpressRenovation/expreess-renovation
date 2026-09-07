'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    LayoutDashboard,
    FileText,
    DollarSign,
    Settings,
    Search,
    ChevronRight,
    LogOut,
    Sparkles,
    Briefcase,
    MessageSquare,
    Package,
    Building2,
    Receipt,
    BarChart3,
    HardHat,
    PanelLeftClose,
    PanelLeftOpen,
    Users,
    CalendarDays,
    TrendingUp,
    Bot,
    Activity,
    SlidersHorizontal,
    FileSearch,
    Moon,
    Sun,
    ChevronsUpDown,
} from 'lucide-react';
import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/site-assets';
import { SITE_NAME } from '@/lib/contact-info';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useAuth } from '@/hooks/use-auth';

interface ModernSidebarProps {
    t: any;
    className?: string;
}

export function ModernSidebar({ t, className }: ModernSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const footerRef = useRef<HTMLDivElement>(null);

    // Close the account menu on outside click / Escape. Both children of the
    // panel (theme toggle, notification bell) render in-DOM (no portals), so any
    // click inside `footerRef` is genuinely "inside" and must not close it.
    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut();
            router.push('/login');
        } finally {
            setSigningOut(false);
        }
    };

    // Display name: prefer the provider displayName, else the local part of the
    // email, else a neutral fallback.
    const displayName = user?.displayName?.trim()
        || (user?.email ? user.email.split('@')[0] : 'Usuario');
    const avatarInitial = (displayName[0] || 'U').toUpperCase();

    const isDark = theme === 'dark-theme-luxury';
    const toggleTheme = () => setTheme(isDark ? 'theme-luxury' : 'dark-theme-luxury');

    // Asistente AI is the flagship entry: it lives outside every group and is
    // rendered first with a visual accent (primary tint + soft background).
    const highlightItem = {
        href: '/dashboard/wizard',
        label: 'Asistente AI',
        icon: Sparkles,
    };

    // Modules grouped by function. Order: what users reach for most first.
    const navGroups = [
        {
            label: 'IA',
            items: [
                { href: '/dashboard/seo-generator', label: t.dashboard.nav.seoGenerator, icon: Search },
                { href: '/dashboard/admin/jobs', label: 'Jobs IA', icon: Activity },
                { href: '/dashboard/admin/pdf-layout-test', label: 'Lecturas PDF', icon: FileSearch },
                { href: '/dashboard/admin/traces', label: 'Trazas IA', icon: Bot },
            ]
        },
        {
            label: 'Operación',
            items: [
                { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: LayoutDashboard },
                { href: '/dashboard/admin/budgets', label: t.dashboard.nav.myBudgets, icon: FileText },
                { href: '/dashboard/projects', label: 'Obras', icon: Building2 },
                { href: '/dashboard/expenses', label: 'Facturas', icon: Receipt },
                { href: '/dashboard/analytics', label: 'Analíticas', icon: BarChart3 },
            ]
        },
        {
            label: 'CRM',
            items: [
                { href: '/dashboard/leads', label: 'Leads', icon: Users },
                { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
                { href: '/dashboard/marketing', label: 'Marketing', icon: TrendingUp },
                { href: '/dashboard/admin/messages', label: 'Mensajes', icon: MessageSquare },
            ]
        },
        {
            label: 'Configuración',
            items: [
                { href: '/dashboard/settings/company', label: 'Empresa', icon: Building2 },
                { href: '/dashboard/admin/prices', label: t.dashboard.nav.priceBook, icon: Briefcase },
                { href: '/dashboard/admin/prices?view=catalog', label: 'Catálogo', icon: Package },
                { href: '/dashboard/settings/pricing', label: t.dashboard.nav.quickPricing, icon: DollarSign },
                { href: '/dashboard/settings/budget', label: 'Calibración', icon: SlidersHorizontal },
                { href: '/dashboard/settings', label: t.dashboard.nav.settings, icon: Settings },
            ]
        }
    ];

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative group/sidebar",
                collapsed ? "w-[68px]" : "w-64",
                className
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                    "absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border",
                    "flex items-center justify-center shadow-md",
                    "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                    "transition-all duration-200 opacity-0 group-hover/sidebar:opacity-100"
                )}
            >
                {collapsed ? (
                    <PanelLeftOpen className="w-3 h-3" />
                ) : (
                    <PanelLeftClose className="w-3 h-3" />
                )}
            </button>

            {/* Logo Area */}
            <div className={cn("flex items-center px-4 mb-4 mt-4 transition-all duration-300", collapsed ? "justify-center" : "")}>
                <AnimatePresence mode="wait">
                    {collapsed ? (
                        <motion.div
                            key="icon"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20"
                        >
                            <HardHat className="w-5 h-5 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-40 h-12"
                        >
                            <Image
                                src={BRAND_ASSETS.logo}
                                alt={SITE_NAME}
                                fill
                                sizes="160px"
                                className="object-contain object-left"
                                priority
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-sidebar-border/50 mb-4" />

            {/* Navigation */}
            <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide px-2">
                {/* Highlighted Asistente AI (top-level, outside groups) */}
                {(() => {
                    const isActive = pathname === highlightItem.href || pathname.startsWith(highlightItem.href);
                    const Icon = highlightItem.icon;
                    return (
                        <Link
                            href={highlightItem.href as any}
                            title={collapsed ? highlightItem.label : undefined}
                            className={cn(
                                "relative flex items-center rounded-xl font-semibold transition-all duration-200 group/item overflow-hidden border",
                                collapsed ? "justify-center px-0 py-2.5 mx-auto w-11 h-11" : "gap-3 px-3 py-3",
                                isActive
                                    ? "text-foreground dark:text-primary bg-primary/15 border-primary/30 shadow-sm shadow-primary/10"
                                    : "text-foreground dark:text-primary bg-primary/5 border-primary/10 hover:bg-primary/10 hover:border-primary/20"
                            )}
                        >
                            <Icon className={cn(
                                "shrink-0 text-amber-600 dark:text-primary",
                                collapsed ? "h-5 w-5" : "h-4 w-4"
                            )} />
                            {!collapsed && (
                                <span className="truncate text-sm">{highlightItem.label}</span>
                            )}
                            {!collapsed && !isActive && (
                                <span className="ml-auto text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-700 dark:bg-primary/20 dark:text-primary px-1.5 py-0.5 rounded">
                                    IA
                                </span>
                            )}
                        </Link>
                    );
                })()}

                {navGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        {/* Group Label */}
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="px-2 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]"
                                >
                                    {group.label}
                                </motion.h3>
                            )}
                        </AnimatePresence>

                        {/* Nav Items */}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href as any}
                                        title={collapsed ? item.label : undefined}
                                        className={cn(
                                            "relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 group/item overflow-hidden",
                                            collapsed ? "justify-center px-0 py-2.5 mx-auto w-11 h-11" : "gap-3 px-3 py-2.5",
                                            isActive
                                                ? "text-primary bg-primary/10"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active-pill"
                                                className={cn(
                                                    "absolute bg-primary rounded-r-full",
                                                    collapsed ? "left-0 w-[3px] h-5" : "left-0 w-1 h-6"
                                                )}
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn(
                                            "shrink-0 transition-colors",
                                            collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
                                        )} />
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="truncate"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                        {!collapsed && isActive && <ChevronRight className="h-3 w-3 ml-auto text-primary/50" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer — single account control. The avatar opens a mini panel with
                theme, alerts, settings and sign-out. */}
            <div ref={footerRef} className="mt-auto border-t border-sidebar-border pt-3 pb-3 px-2 relative">

                {/* Account mini panel */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "absolute z-50 bottom-full mb-2 w-64 rounded-xl border bg-background shadow-xl",
                                collapsed ? "left-2" : "left-2 right-2 w-auto"
                            )}
                        >
                            {/* User header */}
                            <div className="p-3 flex items-center gap-3 border-b border-border">
                                <div className="rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 border border-white/10 flex items-center justify-center font-bold text-white shadow-sm h-9 w-9 text-sm shrink-0">
                                    {avatarInitial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                                    {user?.email && (
                                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Theme toggle */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                <span>Tema</span>
                                <span className="ml-auto text-[11px] text-muted-foreground/70">
                                    {isDark ? 'Oscuro' : 'Claro'}
                                </span>
                            </button>

                            {/* Alerts (self-contained bell) */}
                            <div className="px-2 py-1">
                                <NotificationBell />
                            </div>

                            <div className="border-t border-border" />

                            {/* Settings */}
                            <Link
                                href={'/dashboard/settings' as any}
                                onClick={() => setMenuOpen(false)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <Settings className="h-4 w-4" />
                                <span>Configuración</span>
                            </Link>

                            {/* Sign out */}
                            <button
                                type="button"
                                onClick={handleSignOut}
                                disabled={signingOut}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{signingOut ? 'Cerrando…' : 'Cerrar sesión'}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Avatar trigger */}
                <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    title={collapsed ? displayName : undefined}
                    className={cn(
                        "bg-sidebar-accent/50 rounded-xl flex items-center border border-sidebar-border hover:border-sidebar-ring/50 transition-colors cursor-pointer group/user w-full text-left",
                        menuOpen && "border-sidebar-ring/50 bg-sidebar-accent",
                        collapsed ? "justify-center p-2" : "gap-3 p-3"
                    )}
                >
                    <div className={cn(
                        "rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 border border-white/10 flex items-center justify-center font-bold text-white shadow-sm",
                        collapsed ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
                    )}>
                        {avatarInitial}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-sidebar-foreground truncate group-hover/user:text-primary transition-colors">{displayName}</p>
                            <p className="text-[10px] text-muted-foreground">Administrador</p>
                        </div>
                    )}
                    {!collapsed && <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover/user:text-foreground transition-colors shrink-0" />}
                </button>
            </div>
        </aside>
    );
}
