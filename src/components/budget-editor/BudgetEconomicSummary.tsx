import { Card, CardContent } from '@/components/ui/card';
import { BudgetCostBreakdown } from '@/backend/budget/domain/budget';

interface BudgetEconomicSummaryProps {
    costBreakdown: BudgetCostBreakdown;
}

export const BudgetEconomicSummary = ({ costBreakdown }: BudgetEconomicSummaryProps) => {
    return (
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
            <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Resumen Económico</h3>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>PEM</span>
                        <span className="font-mono">{costBreakdown.materialExecutionPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-500 pl-2">
                        <span>GG (13%)</span>
                        <span className="font-mono">{costBreakdown.overheadExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-500 pl-2">
                        <span>BI (6%)</span>
                        <span className="font-mono">{costBreakdown.industrialBenefit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                </div>

                <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between font-medium text-slate-700">
                        <span>Base Imponible</span>
                        <span>{(costBreakdown.materialExecutionPrice + costBreakdown.overheadExpenses + costBreakdown.industrialBenefit).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>IVA (21%)</span>
                        <span className="font-mono">{costBreakdown.tax.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                </div>

                <div className="border-t-2 border-primary/10 pt-4 flex justify-between items-end">
                    <span className="font-bold text-lg text-primary">Total</span>
                    <span className="font-bold text-2xl text-primary">{costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
            </CardContent>
        </Card>
    );
};
