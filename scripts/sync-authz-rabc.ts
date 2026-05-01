import 'dotenv/config';
import { z } from 'zod';
import authzAdmin from '../lib/auth0/authzAdmin';
import { permissions } from '../lib/data/rabc';

// This script adds permissions to authz
async function syncPermissions() {
  console.log('Scope (permissions) sync in progress');
  try {
    await authzAdmin.updateResourceServer(
      {
        id: process.env.AUTH0_API_APP_RESOURCE_ID,
      },
      {
        scopes: permissions.map((permission) => ({
          value: permission,
          description: permission,
        })),
      }
    );

    // Get admin role
    const adminRole = await authzAdmin.getRoles({
      name_filter: 'admin',
    });
    const adminRoleId = adminRole[0].id;

    // Add permissions to admin role
    await authzAdmin.addPermissionsInRole(
      {
        id: z.string().parse(adminRoleId),
      },
      {
        permissions: permissions.map((permission) => ({
          permission_name: permission,
          resource_server_identifier: process.env.NEXT_PUBLIC_AUTH0_API_APP_IDENTIFIER,
        })),
      }
    );

    console.log('Scope (permissions) sync completed');
  } catch (error) {
    console.log('Scope (permissions) sync failed', error);
  }
}

syncPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
