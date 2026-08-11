'use server';

import { getFirestore } from 'firebase-admin/firestore';

import { FirestoreBookingRepository } from '@/backend/agenda/infrastructure/firestore-booking-repository';
import { CreateBookingUseCase, GetAvailabilityUseCase, CancelBookingUseCase } from '@/backend/agenda/application/booking-use-cases';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/firestore-lead-repository';
import { FirestoreAvailabilityRepository } from '@/backend/agenda/infrastructure/firestore-availability-repository';
import { CONTACT_INFO, SITE_NAME } from '@/lib/contact-info';

const bookingRepo = new FirestoreBookingRepository();
const leadRepo = new FirestoreLeadRepository();
const availabilityRepo = new FirestoreAvailabilityRepository();

/**
 * Get available time slots for a date range
 */
export async function getAvailableSlotsAction(
    startDate: string,
    endDate: string
): Promise<Record<string, { startTime: string; endTime: string; isAvailable: boolean }[]>> {
    const useCase = new GetAvailabilityUseCase(bookingRepo, availabilityRepo);
    const result = await useCase.execute({
        startDate: new Date(startDate),
        endDate: new Date(endDate)
    });

    const serialized: Record<string, { startTime: string; endTime: string; isAvailable: boolean }[]> = {};
    for (const [dateKey, slots] of Object.entries(result)) {
        serialized[dateKey] = slots.map(s => ({
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable
        }));
    }
    return serialized;
}

/**
 * Create a new booking
 */
export async function createBookingAction(params: {
    name: string;
    email: string;
    phone: string | null;
    date: string;
    timeSlot: string;
}): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    const useCase = new CreateBookingUseCase(bookingRepo);
    return useCase.execute({
        ...params,
        date: new Date(params.date)
    });
}

/**
 * Cancel a booking
 */
export async function cancelBookingAction(bookingId: string): Promise<{ success: boolean; error?: string }> {
    const useCase = new CancelBookingUseCase(bookingRepo);
    return useCase.execute(bookingId);
}

/**
 * Create a new booking directly from a Lead ID
 */
export async function createBookingFromLeadAction(params: {
    leadId: string;
    date: string;
    timeSlot: string;
}): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    const lead = await leadRepo.findById(params.leadId);
    if (!lead) return { success: false, error: 'Lead no encontrado' };

    const useCase = new CreateBookingUseCase(bookingRepo);
    const result = await useCase.execute({
        name: lead.personalInfo.name,
        email: lead.personalInfo.email,
        phone: lead.personalInfo.phone,
        leadId: lead.id,
        date: new Date(params.date),
        timeSlot: params.timeSlot
    });

    // Enviar email de confirmación si la reserva fue exitosa
    if (result.success && lead.personalInfo.email) {
        try {
            const db = getFirestore();
            await db.collection('mail').add({
                to: lead.personalInfo.email,
                message: {
                    subject: `Confirmación de tu visita técnica - ${SITE_NAME}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>Hola ${lead.personalInfo.name.split(' ')[0]},</h2>
                            <p>Tu visita técnica ha sido confirmada para el <strong>${params.date}</strong> a las <strong>${params.timeSlot}</strong>.</p>
                            <br/>
                            <p>¿Qué haremos en la visita?</p>
                            <ul>
                                <li>Tomamos medidas y revisamos el estado actual del inmueble.</li>
                                <li>Definimos contigo el alcance de la obra y las calidades.</li>
                                <li>Preparamos un presupuesto cerrado por partidas, sin sorpresas.</li>
                            </ul>
                            <br/>
                            <p>Si necesitas cambiar la cita, contáctanos en el ${CONTACT_INFO.phone}.</p>
                            <br/>
                            <p>Un saludo,<br/><strong>El equipo de ${SITE_NAME}</strong></p>
                        </div>
                    `
                }
            });
            console.log(`[Agenda] Confirmation email sent to ${lead.personalInfo.email}`);
        } catch (emailError) {
            console.error('[Agenda] Failed to send confirmation email:', emailError);
            // No bloqueamos el return de success aunque falle el email
        }
    }

    return result;
}

/**
 * Get bookings for the admin calendar
 */
export async function getAdminBookingsAction(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const bookings = await bookingRepo.findByDateRange(start, end);

    // Serialize for the client
    return bookings.map(b => ({
        id: b.id,
        leadId: b.leadId,
        name: b.name,
        email: b.email,
        phone: b.phone,
        date: b.date.toISOString(),
        timeSlot: b.timeSlot,
        status: b.status,
    }));
}
