import { Budget } from "@/backend/budget/domain/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Map, Phone, Mail, User, Image as ImageIcon, File } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BudgetRequestViewerProps {
    budget: Budget;
}

export function BudgetRequestViewer({ budget }: BudgetRequestViewerProps) {
    const { clientData, type, createdAt } = budget;
    // Cast clientData based on type for safety within this scope, though we handle properties generically where shared.
    const isNewBuild = type === 'new_build';
    const isQuick = type === 'quick';

    // Helper to safely access common properties
    const description = (clientData as any).description;
    const files = (clientData as any).files || [];

    // New Build specific helpers
    const plotArea = (clientData as any).plotArea;
    const buildingArea = (clientData as any).buildingArea;
    const floors = (clientData as any).floors;
    const hasGarage = (clientData as any).garage;
    const hasPool = (clientData as any).pool;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {isNewBuild ? "Solicitud de Obra Nueva" : "Solicitud de Presupuesto Rápido"}
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">Ref: {budget.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>{format(createdAt, "PPP 'a las' p", { locale: es })}</span>
                    </p>
                </div>
                <Badge className="text-base px-4 py-1" variant={budget.status === 'pending_review' ? 'destructive' : 'default'}>
                    {budget.status === 'pending_review' ? 'Pendiente de Revisión' : budget.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Main Info */}
                <div className="md:col-span-2 space-y-8">
                    {/* Project Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Descripción del Proyecto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate max-w-none">
                                {description ? (
                                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{description}</p>
                                ) : (
                                    <p className="text-slate-400 italic">Sin descripción proporcionada.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* New Build Specifics */}
                    {isNewBuild && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Map className="w-5 h-5 text-primary" />
                                    Detalles de la Parcela y Construcción
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Parcela</dt>
                                        <dd className="text-xl font-semibold text-slate-900">{plotArea} m²</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Construcción</dt>
                                        <dd className="text-xl font-semibold text-slate-900">{buildingArea} m²</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Plantas</dt>
                                        <dd className="text-xl font-semibold text-slate-900">{floors}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Extras</dt>
                                        <dd className="text-sm font-semibold text-slate-900 flex flex-col">
                                            {hasGarage && <span>• Garaje</span>}
                                            {hasPool && <span>• Piscina</span>}
                                            {!hasGarage && !hasPool && <span className="text-slate-400">-</span>}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    {/* Multimedia Gallery */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                Archivos Adjuntos ({files.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {files.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {files.map((file: string, index: number) => {
                                        // Simple extension check to decide how to render
                                        // In a real app, storing metadata (mimeType) is better
                                        const isVideo = file.match(/\.(mp4|mov|webm)$/i);
                                        const isPdf = file.match(/\.pdf$/i);
                                        const isImage = !isVideo && !isPdf;

                                        return (
                                            <div key={index} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                {isImage && (
                                                    <img
                                                        src={file}
                                                        alt={`Adjunto ${index + 1}`}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                )}
                                                {isVideo && (
                                                    <video
                                                        src={file}
                                                        controls
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                {isPdf && (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 hover:text-primary transition-colors">
                                                        <File className="w-12 h-12 mb-2" />
                                                        <span className="text-xs font-medium">Documento PDF</span>
                                                    </div>
                                                )}

                                                {/* Overlay / Link */}
                                                <a
                                                    href={file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="bg-white/90 text-xs font-medium px-2 py-1 rounded shadow-sm">Abrir</span>
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No hay archivos adjuntos.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Contact Info */}
                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Datos del Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-slate-500">Nombre</div>
                                <div className="font-semibold text-slate-900">{clientData.name}</div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email
                                </div>
                                <a href={`mailto:${clientData.email}`} className="text-primary hover:underline block truncate">
                                    {clientData.email}
                                </a>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Teléfono
                                </div>
                                <a href={`tel:${clientData.phone}`} className="text-slate-900 hover:text-primary block">
                                    {clientData.phone}
                                </a>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium text-slate-500">Dirección del Proyecto</div>
                                <div className="text-slate-700">{clientData.address}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
