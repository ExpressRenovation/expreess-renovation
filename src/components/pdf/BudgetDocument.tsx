'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333'
    },
    header: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottom: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    logoSection: {
        width: '40%'
    },
    companyLogo: {
        width: 140,
        height: 60,
        marginBottom: 10,
        objectFit: 'contain'
    },
    metaSection: {
        textAlign: 'right',
        fontSize: 8,
        color: '#64748B',
        lineHeight: 1.4
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 5,
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        color: '#B45309', // Dochevi Orange/Amber
        borderBottom: 1,
        borderBottomColor: '#FDE68A',
        paddingBottom: 4,
        textTransform: 'uppercase'
    },
    textBlock: {
        marginBottom: 8,
        lineHeight: 1.6,
        fontSize: 9,
        textAlign: 'justify'
    },
    bold: {
        fontWeight: 'bold',
        color: '#0F172A'
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#E2E8F0',
        marginTop: 10,
        marginBottom: 20
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableCol: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 5
    },
    tableColDesc: {
        width: '40%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 5
    },
    tableHeader: {
        backgroundColor: '#F8FAFC',
        fontWeight: 'bold',
        fontSize: 8,
        color: '#475569'
    },
    totalSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: 2,
        borderColor: '#B45309',
        alignItems: 'flex-end'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '45%',
        marginBottom: 4
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#64748B'
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0F172A'
    },
    finalTotal: {
        fontSize: 16,
        color: '#B45309',
        fontWeight: 'bold',
        marginTop: 8,
        borderTop: 1,
        borderColor: '#FDE68A',
        paddingTop: 5
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
    },
    footerLine: {
        borderTop: 1,
        borderColor: '#E2E8F0',
        marginBottom: 5
    },
    footerText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 7,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        padding: '2 6',
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold'
    }
});

interface BudgetDocumentProps {
    budgetNumber: string;
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    items: any[];
    costBreakdown: any;
    date: string;
    logoUrl?: string;
}

const Footer = ({ pageNumber }: { pageNumber: number }) => (
    <View style={styles.footerContainer} fixed>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>
            DOCHEVI CONSTRUCCION Y REFORMAS SL - CIF: B75257238 - C/ Ramón de Montcada 37, 07183 Calviá {"\n"}
            www.expressrenovationmallorca.com - Tlf: 697 26 22 21 - Página {pageNumber}
        </Text>
    </View>
);

const Header = ({ budgetNumber, date, logoUrl }: { budgetNumber: string, date: string, logoUrl?: string }) => (
    <View style={styles.header}>
        <View style={styles.logoSection}>
            {logoUrl ? (
                <Image
                    src={logoUrl}
                    style={styles.companyLogo}
                />
            ) : (
                <View style={[styles.companyLogo, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 8, color: '#94A3B8' }}>DOCHEVI</Text>
                </View>
            )}
        </View>
        <View style={styles.metaSection}>
            <Text style={styles.bold}>PRESUPUESTO Nº {budgetNumber}</Text>
            <Text>Fecha: {date}</Text>
            <Text>Expedido por: Georgi Yordanaov Dochev</Text>
        </View>
    </View>
);

export const BudgetDocument = ({
    budgetNumber,
    clientName,
    clientEmail,
    clientAddress,
    items,
    costBreakdown,
    date,
    logoUrl
}: BudgetDocumentProps) => (
    <Document>
        {/* --- PAGE 1: INTRO & COVER --- */}
        <Page size="A4" style={styles.page}>
            <Header budgetNumber={budgetNumber} date={date} logoUrl={logoUrl} />

            <View style={{ marginTop: 20, marginBottom: 30 }}>
                <Text style={styles.title}>Propuesta Técnica y Económica</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                    <Text style={styles.badge}>Reforma Personalizada</Text>
                    <Text style={styles.badge}>Dochevi Estándar de Calidad</Text>
                </View>
            </View>

            <View style={{ marginBottom: 30, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' }}>Cliente / Ubicación</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 }}>{clientName}</Text>
                <Text style={{ fontSize: 10, color: '#475569' }}>{clientEmail}</Text>
                <Text style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{clientAddress || 'Dirección de obra facilitada'}</Text>
            </View>

            <Text style={styles.sectionTitle}>1. Por qué es importante leer este presupuesto hasta el final</Text>
            <Text style={styles.textBlock}>
                Independientemente de que finalmente trabajemos juntos o no, le recomendamos leer este presupuesto hasta el final.
                La información que contiene le ayudará a comprender cómo debe desarrollarse un proceso de reforma bien organizado, seguro y de calidad, qué riesgos es importante evitar y cómo tomar una decisión informada al elegir a la empresa ejecutora.
            </Text>
            <Text style={styles.textBlock}>
                Este documento no es solo un precio: describe nuestra forma de trabajar, el nivel de responsabilidad que asumimos y el valor real que recibe como cliente.
            </Text>

            <Text style={styles.sectionTitle}>2. Precio y Validez del Presupuesto</Text>
            <Text style={styles.textBlock}>
                El precio total estimado para este proyecto es de <Text style={styles.bold}>{costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Text>.
            </Text>
            <Text style={styles.textBlock}>
                <Text style={styles.bold}>Validez del presupuesto:</Text> hasta el 15 días posteriores a la fecha de emisión.
                Trabajamos con planificación previa y con capacidad limitada. Una vez finalizado el plazo de validez, no podemos garantizar ni el precio ni las fechas de inicio y ejecución indicadas.
            </Text>

            <Text style={styles.sectionTitle}>3. Qué problemas resolvemos por usted</Text>
            <Text style={styles.textBlock}>
                Como cliente, no debería supervisar diariamente si los trabajos se están realizando correctamente, conocer materiales técnicos, coordinar operarios o asumir riesgos de mala planificación.
            </Text>
            <Text style={styles.textBlock}>
                En la práctica, la falta de organización suele provocar retrasos y sobrecostes. Nuestro trabajo consiste en asumir ese riesgo por usted y ofrecerle un proceso tranquilo, claro y previsible.
            </Text>

            <Footer pageNumber={1} />
        </Page>

        {/* --- PAGE 2: METHODOLOGY & FAQ --- */}
        <Page size="A4" style={styles.page}>
            <Header budgetNumber={budgetNumber} date={date} logoUrl={logoUrl} />

            <Text style={styles.sectionTitle}>4. Qué hacemos y qué beneficios obtiene usted</Text>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.textBlock, styles.bold]}>✔ Experiencia contrastada y control real</Text>
                <Text style={styles.textBlock}>
                    Contamos con 25 años de experiencia práctica real. Dispongo de formación profesional en diseño de interiores, lo que me permite tener una visión global de cada proyecto: funcional, estético y duradero. Cada fase está supervisada personalmente.
                </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.textBlock, styles.bold]}>✔ Equipo propio, medios y estándares</Text>
                <Text style={styles.textBlock}>
                    Trabajamos con personal propio y formado. Todos cuentan con equipos de protección individual y siguen estándares claros de ejecución. Disponemos de herramientas profesionales de alta precisión.
                </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.textBlock, styles.bold]}>✔ Materiales de calidad y buena ejecución</Text>
                <Text style={styles.textBlock}>
                    Utilizamos materiales contrastados que previenen problemas futuros y evitan reparaciones innecesarias, suponiendo un ahorro de tiempo y dinero para usted.
                </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.textBlock, styles.bold]}>✔ Pensamos como inversor y como cliente</Text>
                <Text style={styles.textBlock}>
                    Como profesional que ha sido inversor, entiendo perfectamente sus necesidades. Abordamos cada proyecto como si fuera para nosotros mismos.
                </Text>
            </View>

            <Text style={styles.sectionTitle}>5. Plazos de inicio y organización</Text>
            <Text style={styles.textBlock}>
                Este sistema de trabajo nos permite no asumir más proyectos de los que podemos ejecutar correctamente, cumplir los plazos acordados y mantener un nivel de calidad constante.
            </Text>

            <Text style={styles.sectionTitle}>6. Preguntas frecuentes</Text>
            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>¿Por qué el precio es más alto que otras ofertas?</Text>
                <Text style={styles.textBlock}>Porque incluye organización integral, 25 años de experiencia y responsabilidad real. Un precio más bajo casi siempre implica concesiones en materiales, ejecución o control.</Text>
            </View>
            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>¿Tendré que supervisar la obra constantemente?</Text>
                <Text style={styles.textBlock}>No. Nuestro trabajo es que usted no tenga que involucrarse en cuestiones técnicas u operativas.</Text>
            </View>

            <View wrap={false} style={{ marginTop: 30, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 4 }}>
                <Text style={[styles.textBlock, styles.bold, { textAlign: 'center', marginBottom: 0 }]}>
                    No buscamos clientes que elijan únicamente por precio. Trabajamos con quienes valoran seguridad, calidad y profesionalidad.
                </Text>
            </View>

            <Footer pageNumber={2} />
        </Page>

        {/* --- PAGE 3: DETAILED BUDGET --- */}
        <Page size="A4" style={styles.page}>
            <Header budgetNumber={budgetNumber} date={date} logoUrl={logoUrl} />

            <Text style={styles.sectionTitle}>Desglose Detallado de Partidas</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.tableCol}><Text>REF</Text></View>
                    <View style={styles.tableColDesc}><Text>CONCEPTO</Text></View>
                    <View style={styles.tableCol}><Text>P. UNIT</Text></View>
                    <View style={styles.tableCol}><Text>CANT.</Text></View>
                    <View style={styles.tableCol}><Text>TOTAL</Text></View>
                </View>
                {items.map((item: any, index: number) => (
                    <View style={styles.tableRow} key={index} wrap={false}>
                        <View style={styles.tableCol}><Text>{item.item?.code || '-'}</Text></View>
                        <View style={styles.tableColDesc}>
                            <Text style={styles.bold}>{item.originalTask}</Text>
                            <Text style={{ fontSize: 7, color: '#64748B', marginTop: 2 }}>{item.item?.description}</Text>
                        </View>
                        <View style={styles.tableCol}><Text>{(item.item?.unitPrice || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text></View>
                        <View style={styles.tableCol}><Text>{item.item?.quantity || 1} {item.item?.unit}</Text></View>
                        <View style={styles.tableCol}><Text>{(item.item?.totalPrice || item.item?.price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text></View>
                    </View>
                ))}
            </View>

            <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Base Imponible (P.E.M.):</Text>
                    <Text style={styles.totalValue}>{costBreakdown.materialExecutionPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Gastos Generales / Org.:</Text>
                    <Text style={styles.totalValue}>{costBreakdown.overheadExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>IVA (10%):</Text>
                    <Text style={styles.totalValue}>{costBreakdown.tax.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, styles.finalTotal, { fontSize: 13 }]}>TOTAL PRESUPUESTO:</Text>
                    <Text style={styles.finalTotal}>{costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Text>
                </View>
            </View>

            <View style={{ marginTop: 40, borderTop: 1, borderColor: '#E2E8F0', paddingTop: 20 }}>
                <Text style={[styles.textBlock, { fontStyle: 'italic', color: '#64748B' }]}>
                    * Este documento es una estimación técnica preliminar. Un experto contactará con usted para realizar una visita técnica y refinar los detalles finales del presupuesto.
                </Text>
            </View>

            <Footer pageNumber={3} />
        </Page>
    </Document>
);
