export type BlogPost = {
    id: number;
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    image: string;
    imageHint: string;
    /** ISO 8601. Feeds both the visible date and the Article structured data. */
    publishedAt: string;
    /** Markdown. Rendered with react-markdown on the post page. */
    content: string;
};

/** ~200 words per minute, rounded up. Used for the "x min de lectura" label. */
export function readingMinutes(markdown: string): number {
    return Math.max(1, Math.round(markdown.trim().split(/\s+/).length / 200));
}

export const blogPosts: BlogPost[] = [
    {
        id: 1,
        slug: 'tendencias-reformas-cocina-2026',
        title: 'Tendencias en Reformas de Cocina para 2026',
        category: 'Reformas',
        excerpt:
            'Descubre las últimas tendencias en diseño de cocinas, desde materiales sostenibles hasta la integración de tecnología inteligente.',
        image:
            'https://images.unsplash.com/photo-1632583824020-937ae9564495?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtb2Rlcm4lMjBraXRjaGVufGVufDB8fHx8MTc1OTcxNDY3NXww&ixlib=rb-4.1.0&q=80&w=1080',
        imageHint: 'modern kitchen',
        publishedAt: '2026-05-14',
        content: `La cocina dejó hace tiempo de ser una estancia de servicio. En la mayoría de las reformas que ejecutamos en Mallorca es hoy el centro de la vivienda: donde se cocina, se trabaja, se recibe y se convive. Ese cambio de uso es el que explica casi todas las tendencias que estamos viendo este año.

## La isla como pieza de mobiliario, no como encimera

La isla sigue siendo la protagonista, pero su tratamiento ha cambiado. En lugar de prolongar el mismo frente de armarios, se diseña como un mueble exento con materialidad propia: piedra natural con canto grueso, madera maciza o acero. La diferencia de acabado respecto al resto de la cocina es intencionada.

Un apunte práctico: una isla exige un mínimo de **90 cm de paso libre** a cada lado, y 110-120 cm si va a haber dos personas trabajando a la vez. En viviendas de menos de 12 m² de cocina, forzar una isla suele empeorar el resultado. Una península bien resuelta rinde más.

## Materiales que envejecen bien

El porcelánico de gran formato se ha impuesto en encimeras por una razón muy concreta: resiste el calor directo, no se mancha y permite continuidad entre encimera y frente sin junta visible.

En Mallorca hay además un factor local que conviene tener presente: **la dureza del agua**. En zonas como Calvià o Andratx, los acabados muy pulidos y los grifos en negro mate marcan la cal con rapidez. El acero inoxidable cepillado y los cuarzos de tono medio perdonan mucho más el día a día.

## Almacenaje: menos armarios altos

La tendencia clara es eliminar o reducir la línea de armarios superiores y sustituirla por columnas de gran capacidad concentradas en un paño. El resultado es una cocina que respira, con más superficie libre de pared para revestimiento o ventana.

Funciona bien cuando hay una despensa o columna alta que absorba el volumen perdido. Sin ella, se gana estética y se pierde uso.

## Iluminación en tres capas

Una cocina bien iluminada combina tres niveles: general en techo, funcional bajo los armarios altos o sobre la isla, y ambiental para el uso nocturno. Con una única fuente cenital, quien cocina trabaja siempre a su propia sombra.

Para la zona de trabajo conviene una temperatura de color neutra (**3.500-4.000 K**), que reproduce fielmente el color de los alimentos.

## Integración de electrodomésticos

Las placas con extracción integrada se han normalizado y resuelven el conflicto entre la campana y las visuales, especialmente en cocinas abiertas al salón o con vistas al exterior. Requieren salida de aire o filtro de carbón con mantenimiento periódico, algo que conviene tener claro antes de decidir.

## Qué presupuesto manejar

En una reforma de cocina en Mallorca, con sustitución completa de instalaciones, alicatado, pavimento, mobiliario y electrodomésticos de gama media, el rango habitual va de **12.000 a 25.000 €** para una cocina de 10-14 m². La horquilla la mueven sobre todo tres partidas: encimera, electrodomésticos y herrajes.

Si estás valorando una reforma, lo más útil es partir de un presupuesto detallado por partidas en lugar de un precio cerrado por metro cuadrado. Es la única forma de comparar ofertas de verdad.`,
    },
    {
        id: 2,
        slug: 'mantenimiento-esencial-piscina',
        title: '5 Consejos para el Mantenimiento Esencial de tu Piscina',
        category: 'Piscinas',
        excerpt:
            'Mantén tu piscina en perfectas condiciones durante todo el año con estos sencillos pero efectivos consejos de mantenimiento.',
        image:
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBwb29sfGVufDB8fHx8MTc1OTc3Mjg5M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        imageHint: 'pool maintenance',
        publishedAt: '2026-06-03',
        content: `El clima de Mallorca alarga la temporada de baño muy por encima de la media peninsular, pero también somete a las piscinas a una combinación exigente: sol intenso, temperaturas altas durante meses y agua de red con mucha cal. Un mantenimiento constante cuesta bastante menos que las reparaciones que evita.

## 1. El pH, antes que el cloro

Es el error más extendido. Se añade cloro y el agua sigue turbia, así que se añade más. Pero por encima de **pH 7,8 el cloro pierde gran parte de su capacidad desinfectante**, de modo que todo lo que se eche de más se desperdicia.

El orden correcto es siempre: primero ajustar el pH a la franja **7,2-7,6**, y solo después corregir el cloro. Con dos mediciones por semana en verano es suficiente.

## 2. Filtración proporcional a la temperatura

La regla práctica más fiable: **horas de filtración = temperatura del agua ÷ 2**. Con el agua a 28 °C, unas 14 horas diarias. Es bastante más de lo que mucha gente aplica.

Conviene además repartir esas horas en dos o tres ciclos en lugar de uno solo, y hacer que coincidan con las horas de más calor y más uso, que es cuando la carga orgánica es mayor.

## 3. Lavado del filtro por presión, no por calendario

El filtro no se lava "cada quince días", se lava cuando el manómetro sube **entre 0,3 y 0,5 bar por encima de la presión con el filtro limpio**. Anota esa presión de referencia justo después de un lavado: sin ella no hay criterio.

Lavar de más también perjudica, porque en la arena se asienta una capa fina que mejora la retención.

## 4. La línea de flotación y la cal

Es donde se acumulan grasas solares y donde primero aparece el cerco. En Mallorca, con aguas duras, el carbonato cálcico se deposita con rapidez sobre el gresite y, si se deja, termina exigiendo un tratamiento ácido agresivo.

Un repaso semanal con esponja y limpiador específico durante la temporada evita casi por completo ese problema. Mantener la **dureza entre 200 y 400 ppm** ayuda: por debajo, el agua se vuelve agresiva y ataca las juntas del vaso.

## 5. La invernada no es cerrar y olvidar

En Mallorca rara vez hay riesgo de helada, así que lo habitual es una invernada activa: reducir la filtración a **2-4 horas diarias**, mantener el pH controlado y aplicar un invernador. Abandonar el vaso lleno y parado durante cinco meses genera algas incrustadas cuya recuperación cuesta más que todo el mantenimiento del invierno.

## Cuándo llamar a un profesional

Hay señales que no conviene dejar pasar: pérdida de nivel superior a **3-4 cm por semana** descontando la evaporación, manchas que reaparecen tras el tratamiento, o presión de filtro que no baja después del lavado. Suelen apuntar a fugas en el circuito, problemas de sales metálicas o filtro agotado, y todos empeoran con el tiempo.`,
    },
    {
        id: 3,
        slug: 'beneficios-aislamiento-sate',
        title: 'Beneficios del Aislamiento Térmico por el Exterior (SATE)',
        category: 'Eficiencia Energética',
        excerpt:
            'Mejora el confort de tu hogar y ahorra en tus facturas de energía con el sistema SATE. Te explicamos cómo funciona y por qué es una inversión inteligente.',
        image:
            'https://images.unsplash.com/photo-1737205785859-3727c4145aed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxob3VzZSUyMGZhY2FkZXxlbnwwfHx8fDE3NTk2NzU2MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        imageHint: 'house insulation',
        publishedAt: '2026-07-09',
        content: `El SATE (Sistema de Aislamiento Térmico por el Exterior) consiste en envolver el edificio por fuera con una capa continua de aislante, fijada al soporte y protegida con mortero, malla y acabado. La idea es sencilla; su efecto sobre el comportamiento del edificio, no tanto.

## Por qué por fuera y no por dentro

Aislar por el interior es más barato y más rápido, pero deja sin resolver el problema principal: **los puentes térmicos**. Frentes de forjado, pilares y cajas de persiana siguen conduciendo calor, y son justo los puntos donde aparecen las condensaciones y el moho.

El SATE, al ser una envolvente continua, los elimina. Y tiene una segunda consecuencia poco comentada: al quedar el muro dentro del volumen aislado, la masa térmica del edificio empieza a trabajar a favor. La vivienda tarda mucho más en calentarse durante el día y en enfriarse por la noche.

En el clima de Mallorca esto importa más que el ahorro en calefacción. **El verano es aquí el problema, no el invierno.**

## Qué se nota realmente

- **Confort estable.** Desaparecen las paredes frías en invierno y los muros que irradian calor por la noche en verano.
- **Menos consumo de climatización.** En viviendas sin aislar construidas antes de 1980, la reducción habitual de demanda está entre el **30 % y el 50 %**.
- **Fin de las condensaciones.** Al subir la temperatura superficial interior del muro, el vapor deja de condensar sobre él.
- **Fachada renovada.** La reforma energética y la estética se resuelven en la misma intervención y con un único andamio.
- **Sin perder metros útiles.** Todo el espesor se coloca por fuera.

## Los materiales, en corto

El **EPS** (poliestireno expandido) es la opción más habitual por relación precio-prestaciones. La **lana mineral** rinde mejor en acústica y comportamiento al fuego, obligatoria en ciertas alturas y usos. El **XPS** se reserva para zócalos y zonas expuestas a humedad.

Los espesores razonables en Mallorca están entre **6 y 10 cm**. Subir de ahí aporta mejoras cada vez menores frente al coste.

## Lo que hay que mirar antes de firmar

El SATE es un sistema, no un producto: aislante, adhesivo, espigas, malla, morteros y acabado deben pertenecer a un mismo fabricante con **DITE/ETE** en vigor. Mezclar componentes de distintas marcas anula la garantía y es el origen de la mayoría de las patologías.

Los tres puntos donde se concentran los fallos son siempre los mismos: el **arranque del zócalo**, los **encuentros con ventanas** y los **remates de coronación**. Un presupuesto que no detalla cómo resuelve esos tres encuentros es un presupuesto incompleto.

## Coste y amortización

En Mallorca, el rango habitual va de **90 a 140 €/m² de fachada**, incluyendo andamio, sistema completo y acabado. Sobre una vivienda unifamiliar con 180 m² de fachada, eso sitúa la intervención entre 16.000 y 25.000 €.

Con los ahorros en climatización y la revalorización asociada a la mejora del certificado energético, el retorno se sitúa habitualmente **entre 8 y 12 años**, y bastante antes si hay ayudas autonómicas o de rehabilitación disponibles en el momento de ejecutar.

## Cuándo no compensa

No es una solución universal. Si la fachada está catalogada o tiene valor patrimonial, si presenta humedades por capilaridad sin resolver, o si la carpintería es de vidrio simple, hay que actuar antes sobre eso: aislar sobre un problema activo no lo corrige, lo esconde.`,
    },
];
