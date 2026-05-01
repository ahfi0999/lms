import { AuthenticationClient } from 'auth0';

const authzClient = new AuthenticationClient({
  domain: new URL(process.env.AUTH0_ISSUER_BASE_URL).hostname,
  clientId: process.env.AUTH0_CLIENT_ID,
});

export default authzClient;
