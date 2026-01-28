'use client';

import React from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Settings,
  PlusCircle,
  DollarSign,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/auth/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { LanguageSwitcher } from './language-switcher';

export function DashboardLayout({ children, t }: { children: React.ReactNode, t: any }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Group 1: Management
  const managementNavItems = [
    { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: <LayoutDashboard /> },
    { href: '/dashboard/admin/budgets', label: t.dashboard.nav.myBudgets, icon: <FileText /> },
    { href: '/dashboard/budget-request', label: t.dashboard.nav.requestBudget, icon: <PlusCircle /> },
  ] as const;

  // Group 2: Library
  const libraryNavItems = [
    { href: '/dashboard/admin/prices', label: t.dashboard.nav.priceBook, icon: <FileText /> },
    { href: '/dashboard/seo-generator', label: t.dashboard.nav.seoGenerator, icon: <Lightbulb /> },
  ] as const;

  // Group 3: Configuration
  const settingsNavItems = [
    { href: '/dashboard/settings/pricing', label: t.dashboard.nav.quickPricing, icon: <DollarSign /> },
    { href: '/dashboard/settings/financial', label: t.dashboard.nav.financial, icon: <DollarSign /> },
    { href: '/dashboard/settings', label: t.dashboard.nav.settings, icon: <Settings /> },
  ] as const;


  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can return a loading spinner here
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  const renderNavGroup = (label: string, items: readonly any[]) => (
    <SidebarGroup>
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
        {label}
      </div>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={{
                children: item.label,
              }}
            >
              <Link href={item.href}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          {renderNavGroup(t.dashboard.sidebar.groups.management, managementNavItems)}
          {renderNavGroup(t.dashboard.sidebar.groups.library, libraryNavItems)}
          {renderNavGroup(t.dashboard.sidebar.groups.configuration, settingsNavItems)}
        </SidebarContent>
        <SidebarFooter className="items-center">
          <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container flex h-16 items-center justify-end">
            <UserNav t={t.header.userNav} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
