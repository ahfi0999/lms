import {
  AppRouteHandlerFnContext,
  handleAuth,
  handleLogin,
  handleProfile,
} from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export default handleAuth({
  // 'silent-login': handleLogin({ authorizationParams: { prompt: 'none' } }),
  'update-session': handleProfile({ refetch: true }),
  login: (req: NextRequest, res: AppRouteHandlerFnContext) => {
    return handleLogin(req, res, {
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_AUTH0_API_APP_IDENTIFIER,
      },
      returnTo: '/dashboard',
    });
  },
});
