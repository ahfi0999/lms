import 'dotenv/config';
import { z } from 'zod';
import authzAdmin from '../lib/auth0/authzAdmin';
import { permissions } from '../lib/data/rabc';
import db from '../lib/db';
import { randomUUID } from 'crypto';
import fs from 'fs';

const roleIds = {
  learner: 'rol_yo65igvDr7NzyTO9',
  admin: 'rol_GxZ51qAM8v5hRngw',
};

async function main() {
  const users = await db.user.findMany({
    where: {
      active: true,
    },
    include: {
      Course: true,
    },
  });

  let count = 0;
  const failed = [];
  for (const user of users) {
    try {
      console.log('count: ', count, user.id, user.email);

      // create user in auth0
      const userAuthzInfo = await authzAdmin.createUser({
        connection: 'Username-Password-Authentication',
        email: user.email,
        password: `${randomUUID()}!C`,
        name: user.name,
        verify_email: Boolean(user.emailVerified),
        picture: user.avatar ? user.avatar : undefined,
        user_metadata: {
          courses: user.Course.map((course) => course.id),
        },
      });

      console.log('created user in auth0: ', userAuthzInfo.user_id);

      // assign correct role
      const userRole = user.role === 'admin' ? roleIds.admin : roleIds.learner;
      await authzAdmin.assignRolestoUser(
        {
          id: z.string().parse(userAuthzInfo.user_id),
        },
        {
          roles: [userRole],
        }
      );

      console.log('assigned role: ', userRole, user.role);

      // For every 50, wait 5 seconds
      if (count >= 50 && count % 50 === 0) {
        console.log('Waiting 5 seconds');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(error);
      failed.push(user);
    }
    count++;
  }

  // Write failed users to file
  console.log('Writing failed users to file');
  fs.writeFileSync(
    './failed-users.json',
    JSON.stringify(
      failed.map((f) => ({
        ...f,
        course: f.Course.map((c) => c.id),
      })),
      null,
      2
    ),
    'utf8'
  );
  console.log('Done');
}

main()
  .then(() => {
    console.log('Done');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
