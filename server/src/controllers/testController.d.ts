import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare const createTest: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTests: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addQuestion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getResults: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=testController.d.ts.map