import { LeadRepository } from '../domain/lead-repository';

export class VerifyLeadAccess {
    constructor(
        private leadRepository: LeadRepository
    ) { }

    async execute(leadId: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
        const lead = await this.leadRepository.findById(leadId);

        if (!lead) {
            return { success: false, error: 'Lead not found' };
        }

        const isValid = lead.verifyOtp(otpCode);

        if (!isValid) {
            // Save attempts count
            await this.leadRepository.save(lead);
            return { success: false, error: 'Invalid or expired code' };
        }

        // Save verified state
        await this.leadRepository.save(lead);

        return { success: true };
    }
}
