import { PrismaClient } from "@prisma/client";
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function checkDbHealth(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
}>;
//# sourceMappingURL=prisma.d.ts.map