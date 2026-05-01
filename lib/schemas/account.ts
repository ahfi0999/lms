import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().nonempty(),
  supportEmail: z.string().email(),
  maxPasswordResetLinksADay: z.number().min(1).max(100),
  logo: z.string().nonempty(),
  contactPage: z.string().url(),
  connectLoginPage: z.string().url().optional(),
  logoDimensions: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  landingPageImage: z
    .string()
    .url()
    .default(
      'https://3ro8b0zdvxfbk7jy.public.blob.vercel-storage.com/illustration-login-knFnLCtOkTplhRo12wQOmwXEbreeJA.jpg'
    ),
});
