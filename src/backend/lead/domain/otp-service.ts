export interface OtpService {
    /**
     * Generates a secure random code.
     */
    generateCode(length?: number): string;

    /**
     * Sends the OTP code to the lead's contact channel (usually email).
     */
    sendOtp(email: string, code: string): Promise<void>;
}
