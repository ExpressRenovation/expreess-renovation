import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowRight, FileText, Lightbulb, TrendingUp, Users, Clock } from 'lucide-react';
import { User } from 'firebase/auth';
import { getAllBudgetsAction } from '@/actions/budget/get-all-budgets.action';
import { DashboardRequestCard } from '@/components/dashboard/dashboard-request-card';

// This is a server component, so we can't use useAuth hook.
// We need to find a way to get user on the server.
// For now, let's mock it.
const mockUser = {
  displayName: 'Usuario',
  email: 'user@example.com'
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any);
  const t = dict.dashboard;
  const user = mockUser; // Should be replaced with actual user from server session

  // Fetch metrics data
  const budgets = await getAllBudgetsAction();

  const totalRequests = budgets.length;
  const totalBudgeted = budgets.reduce((acc, b) => acc + (b.totalEstimated || b.costBreakdown?.total || 0), 0);
  const pendingReview = budgets.filter(b => b.status === 'pending_review').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const otherCards = [
    {
      href: '/dashboard/seo-generator',
      title: t.seoGenerator.title,
      description: t.seoGenerator.description,
      icon: <Lightbulb className="w-8 h-8 text-primary" />,
    },
    {
      href: '/dashboard/admin/budgets',
      title: t.nav.myBudgets,
      description: 'Ver y gestionar tus solicitudes de presupuesto anteriores.',
      icon: <FileText className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {t.welcome.title}, {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}!
        </h1>
        <p className="text-muted-foreground">{t.welcome.description}</p>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.metrics.totalBudgeted}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% {t.metrics.fromLastMonth || "desde el mes pasado"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.metrics.totalRequests}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              +19% {t.metrics.fromLastMonth || "desde el mes pasado"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.metrics.pendingReview}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Client Component for Opening Modal */}
        <DashboardRequestCard t={t.requestBudget} />

        {/* Existing Link Cards */}
        {otherCards.map((card) => (
          <Link href={card.href} key={card.href}>
            <Card className="h-full flex flex-col justify-between hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  {card.icon}
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className='pt-4'>
                  <CardTitle className="text-xl font-headline">{card.title}</CardTitle>
                  <CardDescription className="pt-2">{card.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
