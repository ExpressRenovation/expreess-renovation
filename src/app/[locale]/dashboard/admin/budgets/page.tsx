import { getAllBudgetsAction } from '@/actions/budget/get-all-budgets.action';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function BudgetsListPage() {
    const budgets = await getAllBudgetsAction();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Presupuestos Generados</h2>
                    <p className="text-muted-foreground mt-1">
                        Gestiona, revisa y edita las solicitudes de presupuesto.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Listado de Solicitudes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[100px]">Ref</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Proyecto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Importe</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No hay presupuestos registrados todavía.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                budgets.map((budget) => (
                                    <TableRow key={budget.id} className="group">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {budget.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{budget.clientData.name}</div>
                                            <div className="text-xs text-muted-foreground">{budget.clientData.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {budget.type === 'quick' ? 'Rápido' :
                                                    budget.type === 'new_build' ? 'Obra Nueva' : 'Reforma'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {budget.type === 'quick' ? (
                                                <>
                                                    <div className="font-medium">Solicitud Rápida</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {(budget.clientData as any).description || 'Sin descripción'}
                                                    </div>
                                                </>
                                            ) : budget.type === 'new_build' ? (
                                                <>
                                                    <div className="font-medium">Obra Nueva</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {(budget.clientData as any).description || 'Sin descripción'}
                                                    </div>
                                                </>

                                            ) : (
                                                <>
                                                    <div className="capitalize">{(budget.clientData as any).propertyType}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {(budget.clientData as any).projectScope === 'integral' ? 'Reforma Integral' : 'Reforma Parcial'}
                                                    </div>
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(budget.createdAt, "d MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                budget.status === 'approved' ? 'default' :
                                                    budget.status === 'sent' ? 'secondary' :
                                                        budget.status === 'pending_review' ? 'destructive' : 'outline'
                                            } className="capitalize">
                                                {budget.status === 'pending_review' ? 'Pendiente' : budget.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {budget.totalEstimated.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/admin/budgets/${budget.id}/edit`}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Editar</span>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
