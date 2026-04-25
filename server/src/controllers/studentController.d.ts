import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare const getAvailableTests: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTestById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitTest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAttempts: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=studentController.d.ts.map