import { Redis } from "ioredis";
export declare class InMemoryRedis {
    private store;
    ping(): Promise<"PONG">;
    eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<[number, number, number]>;
    quit(): Promise<"OK">;
    status: string;
}
export declare const redis: InMemoryRedis | Redis;
export declare function checkRedisHealth(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
}>;
//# sourceMappingURL=redis.d.ts.map