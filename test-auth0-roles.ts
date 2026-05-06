import { ManagementClient } from 'auth0';
import * as dotenv from 'dotenv';
dotenv.config();

const authzAdmin = new ManagementClient({
  domain: new URL(process.env.AUTH0_ISSUER_BASE_URL || '').hostname,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

async function main() {
  try {
    const users = await authzAdmin.getUsers({
      sort: 'created_at:1',
      per_page: 5,
    });
    console.log('Users found:', users.length);
    console.log(
      users.map((u) => ({ id: u.user_id, email: u.email, app_metadata: u.app_metadata }))
    );
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

main();
