'use client';

import { useWidgetContext } from '@/context/budget-widget-context';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { NewBuildForm } from '@/components/budget-request/new-build-form';
import { QuickBudgetForm } from '@/components/budget-request/quick-budget-form';
import { Home, Hammer, Palmtree, Sparkles, Zap } from 'lucide-react';
import { BudgetRequestWizard } from '@/components/budget-request-wizard';
import { services } from '@/lib/services';

// Temporary mock for t translations
const mockT = {
    budgetRequest: {
        form: {
            name: { label: "Nombre", placeholder: "Tu nombre" },
            email: { label: "Email", placeholder: "tu@email.com" },
            phone: { label: "Teléfono", placeholder: "600..." },
            address: { label: "Dirección", placeholder: "Calle..." },
            contact: {
                banner: {
                    title: "Información de Contacto",
                    description: "Para enviarte la estimación personalizada."
                }
            },
            projectDefinition: {
                propertyType: {
                    label: "Tipo de Propiedad",
                    residential: "Residencial",
                    commercial: "Comercial",
                    office: "Oficina"
                },
                projectScope: {
                    label: "Alcance del Proyecto",
                    integral: "Reforma Integral",
                    integralDesc: "Renovación completa de la propiedad",
                    partial: "Reforma Parcial",
                    partialDesc: "Solo algunas estancias o zonas"
                },
                partialScope: {
                    label: "Zonas a Reformar",
                    description: "Selecciona todas las que apliquen",
                    options: {
                        bathroom: "Baños",
                        kitchen: "Cocina",
                        demolition: "Demoliciones",
                        ceilings: "Techos",
                        electricity: "Electricidad",
                        carpentry: "Carpintería"
                    }
                },
                totalAreaM2: { label: "Superficie Aprox. (m²)" },
                numberOfRooms: { label: "Habitaciones" },
                numberOfBathrooms: { label: "Baños" }
            },
            quality: { label: "Calidad", placeholder: "Selecciona...", options: { basic: "Básica", medium: "Media", premium: "Premium" } },
            buttons: { submit: "Calcular", loading: "Calculando...", prev: "Atrás", next: "Siguiente" },
            toast: { success: { title: "Enviado", description: "Recibido" }, error: { title: "Error", description: "Fallo" } }
        },
        steps: {
            contact: "Contacto",
            projectDefinition: "Proyecto",
            renovationDetails: "Detalles",
            stylePreferences: "Estilo",
            review: "Revisión",
            demolition: "Demolición",
            bathroom: "Baños",
            kitchen: "Cocina",
            workArea: "Zona Trabajo",
            ceilings: "Techos",
            electricity: "Electricidad",
            carpentry: "Carpintería",
            multimedia: "Multimedia",
            summary: "Resumen"
        },
        // Wizard Steps Specific Translations
        demolition: {
            elevator: "¿Hay ascensor?",
            furniture: "¿Retirar muebles?",
            demolishPartitions: { label: "Demoler Tabiques" },
            demolishPartitionsM2: { label: "M² a demoler" },
            thickWall: { label: "Grosor Muro", thin: "Fino (< 10cm)", thick: "Grueso (> 10cm)" },
            removeDoors: { label: "Quitar Puertas" },
            removeDoorsAmount: { label: "Cantidad puertas" },
            floors: "Levantar Suelos (m²)",
            wallTiles: "Picado Alicatados (m²)"
        },
        bathroom: {
            title: "Baño",
            remove: "Eliminar Baño",
            add: "Añadir Baño",
            quality: { label: "Calidad Acabados" },
            dimensions: "Dimensiones y Elementos",
            wallTiles: "Alicatado Pared (m²)",
            floor: "Suelo (m²)",
            showerTray: "Plato de Ducha",
            showerScreen: "Mampara",
            plumbing: "Fontanería Completa"
        },
        kitchen: {
            title: "Cocina",
            renovate: "¿Renovar Cocina?",
            quality: { label: "Calidad" },
            demolition: "Demolición previa",
            plumbing: "Fontanería",
            dimensions: "Dimensiones (m²)",
            wallTiles: "Alicatado Pared",
            floor: "Suelo"
        },
        workArea: {
            title: "Zona de Trabajo (Oficina)",
            workstations: "Puestos de trabajo",
            meetingRooms: "Salas de reuniones"
        },
        ceilings: {
            falseCeiling: "Falso Techo",
            falseCeilingM2: "M² Falso Techo",
            soundproof: "Insonorización",
            soundproofM2: "M² a insonorizar"
        },
        electricity: {
            title: "Instalación Eléctrica",
            newPanel: "Cuadro Eléctrico Nuevo",
            rooms: "Habitaciones / Estancias",
            sockets: "Enchufes",
            points: "Puntos de luz",
            climate: "Climatización",
            ac: "Instalar Aire Acondicionado",
            hvacCount: "Unidades",
            hvacType: { label: "Tipo", split: "Split Pared", ducts: "Conductos" },
            livingRoom: "Salón",
            kitchen: "Cocina"
        },
        carpentry: {
            flooring: "Suelos",
            floorType: { label: "Tipo de Suelo", parquet: "Parquet / Laminado", tile: "Cerámico / Gres", microcement: "Microcemento" },
            skirting: "Rodapié (m lineales)",
            interiorDoors: "Puertas de Paso",
            changeDoors: "Cambiar Puertas",
            doorCount: "Cantidad",
            doorMaterial: { label: "Material", lacquered: "Lacadas Blancas", wood: "Madera/Roble" },
            sliding: "Puerta Corredera",
            slidingCount: "Cantidad",
            windows: "Ventanas",
            changeWindows: "Cambiar Ventanas",
            windowCount: "Cantidad",
            painting: "Pintura",
            paintWalls: "Pintar Paredes",
            paintWallsM2: "M² Paredes",
            paintCeilings: "Pintar Techos",
            paintCeilingsM2: "M² Techos",
            removeGotele: "Quitar Gotelé",
            removeGoteleM2: "M² Gotelé",
            paintType: { label: "Tipo Pintura", white: "Blanco", color: "Color" }
        },
        multimedia: {
            title: "Archivos y Planos",
            description: "Sube planos o fotos del estado actual",
            upload: "Subir archivos",
            dragDrop: "Arrastra aquí o haz click"
        },
        summary: {
            title: "Resumen de Solicitud",
            description: "Revisa los datos antes de enviar",
            personalInfo: "Datos Personales",
            projectInfo: "Proyecto",
            submit: "Solicitar Presupuesto Gratis"
        },
        quickForm: {
            title: "Presupuesto Rápido",
            description: "Obtén un precio estimado en segundos.",
            renovationType: { label: "Tipo", options: { integral: "Integral", bathrooms: "Baños", kitchen: "Cocina", pool: "Piscina" } },
            squareMeters: { label: "Metros Cuadrados" },
            additionalDetails: { label: "Descripción Adicional", placeholder: "Detalles..." }
        },
        reformInclusions: {
            title: "Incluye:",
            kitchen: ["Demolición", "Fontanería", "Electricidad", "Mobiliario", "Alicatado"],
            bathrooms: ["Sanitarios", "Grifería", "Plato ducha", "Mampara"],
            integral: ["Todo incluído", "Llave en mano"],
            pool: ["Excavación", "Vaso", "Depuradora"]
        },
        selector: {
            title: "¿Cómo podemos ayudarte?",
            subtitle: "Elige la opción que mejor se adapte a tu proyecto.",
            options: {
                wizard: { title: "Presupuesto Inteligente", desc: "Analisis detallado 360º con IA", badge: "Recomendado" },
                newBuild: { title: "Obra Nueva", desc: "Construcción desde cero" },
                fast: { title: "Presupuesto Rápido", desc: "Estimación express para reformas" }
            }
        },
        modal: {
            headers: {
                newBuild: { title: "Estudio de Obra Nueva", desc: "Déjanos analizar la viabilidad de tu proyecto." },
                wizard: { title: "Asistente de Presupuestos", desc: "Detalla tu visión paso a paso." },
                pool: { title: "Cotizador de Piscinas", desc: "Diseña tu oasis perfecto." },
                fast: { title: "Calculadora Rápida", desc: "Obtén una estimación inmediata." }
            },
            cancel: "Cancelar"
        },
        trigger: {
            title: "¿Pensando en renovar?",
            subtitle: "Obtén tu estimación gratuita en segundos.",
            mobileSubtitle: "Click para comenzar",
            modes: {
                general: "Solicitar Presupuesto",
                pool: "Cotizar Piscina",
                reform: "Precio Reforma",
                new_build: "Estudio Obra Nueva",
                kitchen: "Presupuesto Cocina",
                bathroom: "Presupuesto Baño",
                wizard: "Presupuesto 360º"
            }
        },
        confirmation: {
            title: "¡Listo!",
            description: "Aquí tienes tu estimación.",
            poolMessage: "Para piscinas necesitamos ver el terreno.",
            noCostMessage: "Precios orientativos sin IVA.",
            button: "Volver al inicio",
            restartForm: "Empezar de nuevo",
            reviewButton: "Ver opiniones"
        }
    }
};

function BudgetSelector({ onSelect, t }: { onSelect: (mode: 'wizard' | 'new-build' | 'reform') => void, t?: any }) {
    const options = [
        {
            id: 'wizard',
            label: t.budgetRequest.selector.options.wizard.title,
            icon: Sparkles,
            desc: t.budgetRequest.selector.options.wizard.desc,
            color: 'bg-purple-100 text-purple-600',
            badge: t.budgetRequest.selector.options.wizard.badge
        },
        {
            id: 'new-build',
            label: t.budgetRequest.selector.options.newBuild.title,
            icon: Home,
            desc: t.budgetRequest.selector.options.newBuild.desc,
            color: 'bg-slate-100 text-slate-700'
        },
        {
            id: 'reform',
            label: t.budgetRequest.selector.options.fast.title,
            icon: Zap,
            desc: t.budgetRequest.selector.options.fast.desc,
            color: 'bg-orange-100 text-orange-600'
        }
    ];

    return (
        <div className="grid gap-4 py-4">
            {options.map((opt) => (
                <div
                    key={opt.id}
                    onClick={() => onSelect(opt.id as any)}
                    className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-muted/50 cursor-pointer transition-all group relative overflow-hidden"
                >
                    {opt.badge && (
                        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                            {opt.badge}
                        </div>
                    )}
                    <div className={`p-3 rounded-full ${opt.color} group-hover:scale-110 transition-transform`}>
                        <opt.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{opt.label}</h3>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SmartBudgetModal({ dictionary }: { dictionary?: any }) {
    const { isOpen, closeWidget, activeMode, openWidget } = useWidgetContext();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Use dictionary if available, otherwise mockT
    // The wizard expects t.budgetRequest to exist, so we wrap dictionary if it comes from dict.budgetRequest
    const t = dictionary ? { budgetRequest: dictionary } : mockT;

    // Define render content
    const renderContent = () => {
        if (activeMode === 'general') {
            return <BudgetSelector onSelect={(mode) => openWidget(mode)} t={t} />;
        }
        if (activeMode === 'new-build') {
            return <NewBuildForm t={t} onSuccess={closeWidget} onBack={() => openWidget('general')} />;
        }
        if (activeMode === 'wizard') {
            // Pass necessary props to wizard
            return <BudgetRequestWizard t={t} services={services} onBack={() => openWidget('general')} isWidget={true} />;
        }
        // reform / pool / kitchen / bathroom default to QuickForm for now
        // Ideally pool goes to QuickForm with pool preselected
        return <QuickBudgetForm t={t} onBack={() => openWidget('general')} />;
    };

    // Define helper text
    const getHeaderText = () => {
        const selector = t.budgetRequest.selector;
        const headers = t.budgetRequest.modal.headers;

        if (activeMode === 'general') return { title: selector.title, desc: selector.subtitle };
        if (activeMode === 'new-build') return headers.newBuild;
        if (activeMode === 'wizard') return headers.wizard;
        if (activeMode === 'pool') return headers.pool;
        return headers.fast;
    };

    const header = getHeaderText();

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={closeWidget}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-3xl">{header.title}</DialogTitle>
                        <DialogDescription className="text-lg">{header.desc}</DialogDescription>
                    </DialogHeader>
                    <div className="pt-6 px-2">
                        {renderContent()}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={closeWidget}>
            <DrawerContent className="max-h-[95vh] flex flex-col">
                <DrawerHeader className="text-left shrink-0">
                    <DrawerTitle className="font-headline text-2xl">{header.title}</DrawerTitle>
                    <DrawerDescription>{header.desc}</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 overflow-y-auto flex-1">
                    {renderContent()}
                </div>
                <DrawerFooter className="pt-2 shrink-0">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
