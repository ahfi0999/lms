import { z } from 'zod';
import { accountSchema } from '../lib/schemas/account';

export type Account = z.infer<typeof accountSchema>;
