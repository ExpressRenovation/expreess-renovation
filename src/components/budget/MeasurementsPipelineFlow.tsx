'use client';

/**
 * Flujo de mediciones sobre la arquitectura async (Cloud Run Jobs).
 *
 * Aislado del flujo legacy síncrono (`MeasurementsPage`) y activado SOLO
 * cuando `NEXT_PUBLIC_USE_PIPELINE_JOBS` está on. Pasos:
 *   1. El usuario suelta un PDF → `dispatchMeasurementsJob` lo sube a Storage
 *      y llama a `POST /api/v1/jobs/dispatch` (ai-core) → {jobId, budgetId}.
 *   2. Se suscribe al doc `pipeline_jobs/{jobId}` (via PipelineJobControls +
 *      usePipelineJob) para estado/cancel/retry.
 *   3. Al completar el job, navega al editor del presupuesto.
 *
 * Mantiene el branding de Express Renovation (paleta amber/orange).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, Loader2, Sparkles, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePipelineJob } from '@/hooks/use-pipeline-job';
import { dispatchMeasurementsJob } from '@/lib/budget/dispatch-measurements-job';
import { PipelineJobControls } from './PipelineJobControls';
import { PipelineBudgetProgress } from './PipelineBudgetProgress';

type Phase = 'idle' | 'uploading' | 'dispatching' | 'tracking' | 'error';

export function MeasurementsPipelineFlow() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [phase, setPhase] = useState<Phase>('idle');
    const [uploadPct, setUploadPct] = useState(0);
    const [fileName, setFileName] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [budgetId, setBudgetId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Suscripción al job → detecta completado para navegar al editor.
    const { job } = usePipelineJob(jobId);

    useEffect(() => {
        if (job?.status === 'completed' && budgetId) {
            toast({ title: 'Presupuesto generado', description: 'Abriendo el editor…' });
            router.push(`/dashboard/admin/budgets/${budgetId}/edit`);
        }
    }, [job?.status, budgetId, router, toast]);

    const reset = () => {
        setPhase('idle');
        setUploadPct(0);
        setFileName('');
        setJobId(null);
        setBudgetId(null);
        setError(null);
    };

    const onDrop = useCallback(
        async (files: File[]) => {
            const file = files[0];
            if (!file) return;
            if (!user?.uid) {
                setError('Debes iniciar sesión para procesar mediciones.');
                setPhase('error');
                return;
            }
            const uid = user.uid;
            setFileName(file.name);
            setError(null);
            setUploadPct(0);
            setPhase('uploading');

            const res = await dispatchMeasurementsJob({
                file,
                uid,
                leadId: uid,
                strategy: 'ANNEXED',
                onUploadProgress: (f) => setUploadPct(Math.round(f * 100)),
                onPhaseChange: (p) => {
                    if (p === 'dispatching') setPhase('dispatching');
                },
            });

            if (!res.success) {
                setError(res.error);
                setJobId(res.jobId ?? null);
                setPhase('error');
                return;
            }
            setJobId(res.jobId);
            setBudgetId(res.budgetId);
            setPhase('tracking');
        },
        [user?.uid],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        disabled: phase !== 'idle',
    });

    return (
        <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                    Procesador Inteligente de Mediciones
                </h1>
                <p className="text-lg text-muted-foreground">
                    Sube tu PDF de mediciones y el motor de IA lo valora en segundo plano.
                    Puedes seguir el progreso y cancelar/reintentar en cualquier momento.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                {phase === 'idle' && (
                    <Card className="border-dashed border-2 hover:border-amber-500/50 transition-colors bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-16">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    'flex flex-col items-center justify-center cursor-pointer transition-all',
                                    isDragActive && 'scale-105',
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-8 ring-4 ring-amber-500/5 shadow-xl shadow-amber-500/10">
                                    <Upload className="h-10 w-10 text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-semibold text-foreground mb-3">
                                    {isDragActive ? 'Suelta el archivo para procesar' : 'Arrastra tu PDF de Mediciones'}
                                </h3>
                                <p className="text-muted-foreground mb-6 text-center max-w-sm">
                                    El procesamiento corre en un worker dedicado (Cloud Run Jobs) para PDFs grandes.
                                </p>
                                <div className="flex gap-4">
                                    <Badge variant="outline" className="px-3 py-1">PDF</Badge>
                                    <Badge variant="outline" className="px-3 py-1">Hasta 100MB</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(phase === 'uploading' || phase === 'dispatching') && (
                    <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20">
                        <CardContent className="p-16">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative z-10 shadow-lg shadow-amber-500/30">
                                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">
                                    {phase === 'uploading' ? 'Subiendo documento' : 'Encolando el trabajo'}
                                </h3>
                                <p className="text-muted-foreground mb-8 max-w-md truncate">{fileName}</p>
                                <div className="w-full max-w-md space-y-2">
                                    <Progress
                                        value={phase === 'uploading' ? uploadPct : 100}
                                        className="h-3 bg-secondary"
                                        indicatorClassName="bg-gradient-to-r from-amber-500 to-orange-600"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                        <span>{phase.toUpperCase()}</span>
                                        <span>{phase === 'uploading' ? `${uploadPct}%` : '…'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {phase === 'tracking' && (
                    <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Valorando el presupuesto</h3>
                                    <p className="text-sm text-muted-foreground truncate">{fileName}</p>
                                </div>
                            </div>
                            <PipelineBudgetProgress
                                budgetId={budgetId ?? undefined}
                                pipelineJobId={jobId ?? undefined}
                                progress={{ step: 'extracting' }}
                                className="max-w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Al completar, se abrirá automáticamente el editor del presupuesto.
                            </p>
                            <Button variant="outline" size="sm" onClick={reset}>
                                <X className="h-4 w-4 mr-2" />
                                Procesar otro PDF
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {phase === 'error' && (
                    <Card className="border-red-500/50 bg-red-500/5">
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-foreground mb-2">Error al procesar</h3>
                            <p className="text-muted-foreground mb-8">{error}</p>
                            {jobId && (
                                <div className="max-w-md mx-auto mb-8">
                                    <PipelineJobControls jobId={jobId} />
                                </div>
                            )}
                            <Button onClick={reset} size="lg" variant="outline">
                                Intentar de nuevo
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
