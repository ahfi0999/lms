import { z } from 'zod';
import { accountSchema } from '../schemas/account';

const accounts = [
  {
    name: 'Digital Lync',
    supportEmail: 'support@digital-lync.com',
    maxPasswordResetLinksADay: 3,
    contactPage: 'https://www.digital-lync.com/career.html',
    connectLoginPage: 'https://connect.digitallync.ai/auth/auth0',
    logo: '/logos/digitallync.png',
    logoDimensions: {
      width: 200,
      height: 50,
    },
    landingPageImage:
      'https://3ro8b0zdvxfbk7jy.public.blob.vercel-storage.com/illustration-login-knFnLCtOkTplhRo12wQOmwXEbreeJA.jpg',
  },
  {
    name: 'Nexa Design',
    supportEmail: 'hello@nexadesign.ai',
    maxPasswordResetLinksADay: 3,
    contactPage: 'https://www.nexadesign.ai/career.html',
    connectLoginPage: 'https://connect.nexadesign.ai/auth/auth0',
    logo: '/logos/nexadesign.svg',
    logoDimensions: {
      width: 100,
      height: 400,
    },
    landingPageImage:
      'https://3ro8b0zdvxfbk7jy.public.blob.vercel-storage.com/nexadesign-8aBaNpqQx4lm4N6mNSEQPQwq4fWTEO.jpg',
  },
];

const accountId = z.coerce.number().parse(process.env.NEXT_PUBLIC_ACCOUNT);
const account = accountSchema.parse(accounts[accountId]);

export default account;
