import { Lead, PersonalInfo, LeadPreferences } from '../domain/lead';
import { LeadRepository } from '../domain/lead-repository';
import { OtpService } from '../domain/otp-service';
import { v4 as uuidv4 } from 'uuid';

export class RequestLeadAccess {
    constructor(
        private leadRepository: LeadRepository,
        private otpService: OtpService
    ) { }

    async execute(info: PersonalInfo, preferences: LeadPreferences): Promise<{ leadId: string }> {
        // 1. Check if lead exists by email
        let lead = await this.leadRepository.findByEmail(info.email);

        if (!lead) {
            // Create new lead
            lead = Lead.create(uuidv4(), info, preferences);
        } else {
            // Update existing lead contact info/prefs if needed (optional logic)
            // For now, valid to just re-verify
        }

        // 2. Generate OTP
        const code = this.otpService.generateCode();
        lead.generateOtp(code);

        // 3. Save Lead (with new OTP)
        await this.leadRepository.save(lead);

        // 4. Send Email (Async, don't block? Better to await to ensure delivery trigger)
        await this.otpService.sendOtp(lead.personalInfo.email, code);

        return { leadId: lead.id };
    }
}
