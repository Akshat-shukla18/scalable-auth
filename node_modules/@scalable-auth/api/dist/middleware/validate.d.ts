import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
export declare function validate(schema: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map