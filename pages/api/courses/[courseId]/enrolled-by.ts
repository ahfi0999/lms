import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../../lib/auth0/authzAdmin';
import { enrolledByQuerySchema } from '../../../../lib/schemas/zod-schemas';
import logger from '../../../../lib/logger';
import db from '../../../../lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { courseId, page } = enrolledByQuerySchema.parse(req.query);
  const limit = 10;
  const offset = page * limit;

  let enrolledUserIds;
  try {
    const enrolledUsers = await db.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },

      select: {
        users: true,
      },
    });

    enrolledUserIds = enrolledUsers.users;
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'Unable to fetch enrolled users',
    });
  }

  let users;
  const enrolledUserIdsPage = enrolledUserIds.slice(offset, offset + limit);

  if (enrolledUserIdsPage.length === 0) {
    return res.status(200).json({
      result: 'success',
      users: [],
      page: page,
      total: enrolledUserIds.length,
    });
  }

  try {
    // Search for all users whose email is exactly "john@exampleco.com" or "jane@exampleco.com" using OR
    // email:("john@exampleco.com" OR "jane@exampleco.com")
    const query = `user_id:(${enrolledUserIdsPage.map((id) => `"${id}"`).join(' OR ')})`;
    logger.info(`Querying users with query: ${query}`);
    users = await authzAdmin.getUsers({
      q: query,
      search_engine: 'v3',
      fields: 'user_id,name,picture,last_login,email,email_verified',
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'Unable to fetch enrolled users',
    });
  }

  return res.status(200).json({
    result: 'success',
    users: users.map((user) => ({
      id: user.user_id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      lastLogin: user.last_login,
      emailVerified: user.email_verified,
    })),
    page: page,
    total: enrolledUserIds.length,
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), [
  'read:users',
  'read:courses',
]);
