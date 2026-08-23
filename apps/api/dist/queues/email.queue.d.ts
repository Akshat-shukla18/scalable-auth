export interface VerificationEmailJobData {
    to: string;
    name: string;
    code: string;
    expiresInMinutes: number;
}
export interface PasswordResetEmailJobData {
    to: string;
    name: string;
    code: string;
    expiresInMinutes: number;
}
export declare function queueVerificationEmail(data: VerificationEmailJobData): Promise<string>;
export declare function queuePasswordResetEmail(data: PasswordResetEmailJobData): Promise<string>;
export declare function getQueueMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}>;
//# sourceMappingURL=email.queue.d.ts.map