import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import { idSchema } from '../../../../lib/schemas/zod-schemas';
import db from '../../../../lib/db';
import logger from '../../../../lib/logger';
import { ExportedUser } from '../../../../types/auth0';
import authzAdmin from '../../../../lib/auth0/authzAdmin';
import { retry } from '../../../../lib/utils';
import { convertArrayOfObjectsToCSV } from '../../../../lib/files';
import dayjs from 'dayjs';

// Import CSV file and create users in database
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const result = idSchema.safeParse(req.query.courseId);
  if (!result.success) {
    return res.status(400).json({
      result: 'error',
      message: 'Invalid course Id',
    });
  }
  const courseId = result.data;

  let course;
  try {
    course = await db.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },
      select: {
        users: true,
        title: true,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'something went wrong. please try again',
    });
  }

  const users = [] as ExportedUser[];
  // Fetch users info from auth0, there is query limit of 2048 characters, so fetching in batches.
  const SAFE_MAX_QUERY_LENGTH = 2000;
  let done = course.users.length > 0 ? false : true;
  let cursor = 0;
  while (!done) {
    // Search for all users whose email is exactly "john@exampleco.com" or "jane@exampleco.com" using OR	email:("john@exampleco.com" OR "jane@exampleco.com")
    done = true;
    let query = '';
    for (const [index, userId] of course.users.slice(cursor).entries()) {
      const newQuery = query.length > 0 ? `${query} OR "${userId}"` : `"${userId}"`;
      if (newQuery.length > SAFE_MAX_QUERY_LENGTH) {
        done = false;
        cursor = index + cursor;
        break;
      }
      query = newQuery;
    }
    query = `user_id:(${query})`;

    try {
      const data = await retry(() =>
        authzAdmin.getUsers({
          connection: 'Username-Password-Authentication',
          fields: 'user_id,name,email,last_login',
          q: query,
          include_fields: true,
          search_engine: 'v3',
        })
      );
      users.push(
        ...(data.map((i) => ({ ...i, last_login: i.last_login || 'never' })) as ExportedUser[])
      );
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        result: 'error',
        message: 'something went wrong. please try again',
      });
    }
  }

  const csv = convertArrayOfObjectsToCSV(users);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${course.title}_${dayjs().format('DD-MM-YYYY-HH-mm')}.csv`
  );
  res.status(200).send(csv);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), [
  'read:users',
  'read:courses',
]);
