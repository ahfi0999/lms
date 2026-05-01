import { ManagementClient } from 'auth0';

const authzAdmin = new ManagementClient({
  domain: new URL(process.env.AUTH0_ISSUER_BASE_URL).hostname,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

export default authzAdmin;
