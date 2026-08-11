'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ingestPriceBookAction } from '@/actions/price-book/ingest-price-book.action';
import { checkIngestionJobStatus } from '@/actions/price-book/check-job-status.action';
import { IngestionDashboard } from './ingestion-dashboard';
import { IngestionJob } from '@/backend/price-book/domain/ingestion-job';

interface PriceBookUploaderProps {
    locale: string;
    onUploadComplete?: () => void;
}

export function PriceBookUploader({ locale, onUploadComplete }: PriceBookUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [job, setJob] = useState<IngestionJob | null>(null);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const { toast } = useToast();

    // Polling Effect
    useEffect(() => {
        if (!job?.id) return;

        const interval = setInterval(async () => {
            const result = await checkIngestionJobStatus(job.id);
            if (result.success && result.job) {
                const updatedJob = {
                    ...result.job,
                    createdAt: new Date(result.job.createdAt),
                    updatedAt: new Date(result.job.updatedAt)
                };
                setJob(updatedJob);

                if (updatedJob.status === 'completed') {
                    toast({
                        title: "Proceso finalizado",
                        description: `Se han importado ${updatedJob.totalItems} partidas.`,
                    });
                    setFile(null);
                    setJob(null);
                    if (onUploadComplete) onUploadComplete();
                }

                if (updatedJob.status === 'failed') {
                    toast({ title: "Error", description: updatedJob.error, variant: "destructive" });
                    setJob(null);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [job?.id, toast, onUploadComplete]);


    const onDrop = (e: any) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
        } else {
            toast({
                title: "Formato incorrecto",
                description: "Por favor, sube un archivo PDF.",
                variant: 'destructive',
            });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);

            // 1. Upload to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `price-books/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setIsUploading(false);

            // 2. Trigger Server Action (Async Job)
            const result = await ingestPriceBookAction(url, file.name, year);

            if (result.success && result.jobId) {
                // Initialize local job state
                setJob({
                    id: result.jobId,
                    status: 'processing',
                    progress: 0,
                    fileName: file.name,
                    fileUrl: url,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    logs: ['Job started...']
                } as IngestionJob);

                toast({
                    title: "Proceso iniciado",
                    description: "La IA está procesando el documento.",
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            console.error(error);
            setIsUploading(false);
            toast({
                title: "Error",
                description: error.message || "Error al subir el archivo",
                variant: 'destructive',
            });
        }
    };

    if (job) {
        return <IngestionDashboard job={job} onCancel={() => setJob(null)} />;
    }

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
            >
                <div className="flex justify-center mb-4">
                    {file ? <FileText className="h-10 w-10 text-primary" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
                </div>
                {file ? (
                    <div className="space-y-2">
                        <p className="font-medium text-lg">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <p className="font-medium text-lg">Arrastra tu PDF aquí o haz clic para buscar</p>
                        <p className="text-sm text-muted-foreground">Soporta archivos PDF</p>
                    </div>
                )}
                <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf"
                    onChange={(e) => {
                        if (e.target.files) setFile(e.target.files[0]);
                    }}
                />
                {!file && (
                    <label htmlFor="file-upload" className="mt-4 inline-block cursor-pointer px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium">
                        Seleccionar Archivo
                    </label>
                )}
            </div>

            {/* Year Selector */}
            <div className="mt-4 flex items-center justify-end space-x-2">
                <label className="text-sm font-medium">Año de Vigencia:</label>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="border rounded px-2 py-1 w-20 text-center"
                />
            </div>

            {/* Upload Button */}
            {file && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
                    >
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isUploading ? 'Subiendo...' : 'Procesar con IA'}
                    </button>
                </div>
            )}
        </div>
    );
}
