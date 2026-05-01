import 'dotenv/config';
import { z } from 'zod';
import authzAdmin from '../lib/auth0/authzAdmin';
import { permissions } from '../lib/data/rabc';
import db from '../lib/db';
import { randomUUID } from 'crypto';
import fs from 'fs';
import users from './digitallync.json';

async function exportUsersToJson() {
  const job = await authzAdmin.exportUsers({
    connection_id: 'con_tnpJXwOQhlt8wwkF',
    format: 'json',
    fields: [
      {
        name: 'user_metadata',
      },
      {
        name: 'user_id',
      },
      {
        name: 'email',
      },
    ],
  });

  console.log(job);
  return job;
}

async function main() {
  // const job = await exportUsersToJson();

  // let continueLoop = true;
  // while (continueLoop) {
  //   const jobData = await authzAdmin.getJob({
  //     id: job.id,
  //   });

  //   if (jobData.status === 'pending') {
  //     console.log(jobData, 'status pending');
  //     await new Promise((resolve) => setTimeout(resolve, 1000));
  //     continue;
  //   }

  //   console.log(jobData, 'status changed');
  //   fs.writeFile('users.json', JSON.stringify(jobData), (err) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     //file written successfully
  //     console.log('file written successfully');
  //   });

  //   continueLoop = false;
  // }

  const courseIdsToUserIdsMap = new Map<string, string[]>();
  for (const user of users) {
    const courseIds = (user.user_metadata.courses || []).map((i) => String(i));
    for (const courseId of courseIds) {
      if (!courseIdsToUserIdsMap.has(courseId)) {
        courseIdsToUserIdsMap.set(courseId, []);
      }

      const course = courseIdsToUserIdsMap.get(courseId);
      if (course) {
        course.push(user.user_id);
      }
    }
  }

  const failedUsers = [];
  const count = 0;
  for (const [courseId, userIds] of courseIdsToUserIdsMap.entries()) {
    await db.course.update({
      where: {
        id: z.coerce.number().parse(courseId),
      },
      data: {
        users: {
          set: userIds,
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
