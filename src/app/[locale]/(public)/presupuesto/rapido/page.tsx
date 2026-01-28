import { QuickBudgetWizard } from '@/components/budget-request/QuickBudgetWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Presupuesto Rápido - Dochevi Costrucciones',
    description: 'Solicita un presupuesto rápido para tu reforma sin complicaciones.',
};

export default function QuickBudgetPage() {
    return <QuickBudgetWizard />;
}
