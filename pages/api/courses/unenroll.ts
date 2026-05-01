import { NextApiRequest, NextApiResponse } from 'next';
import { unenrollSchema } from '../../../lib/schemas/zod-schemas';
import db from '../../../lib/db';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import logger from '../../../lib/logger';
import { createIssue } from '../../../lib/linear';
import { Prisma } from '@prisma/client';
import { getSessionOrThrow, getUserInfo } from '../../../lib/auth-utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { courseId, userId } = unenrollSchema.parse(req.body);
  const { user } = await getSessionOrThrow(req, res);

  let course: { users: string[]; contentLink: string | null };
  try {
    course = await db.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },
      select: {
        users: true,
        contentLink: true,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'Unable to unenroll user',
    });
  }

  try {
    await db.course.update({
      where: {
        id: courseId,
      },
      data: {
        users: {
          set: course.users.filter((id) => id !== userId),
        },
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'Unable to unenroll user',
    });
  }

  logger.info(`User ${userId} unenrolled from course ${courseId}`);

  // Save app event
  let eventData: Prisma.AppEventCreateInput | undefined;
  try {
    eventData = {
      type: 'COURSE_ACCESS',
      user: {
        connectOrCreate: {
          where: {
            id: user.sub,
          },
          create: {
            id: user.sub,
            email: user.email,
            name: user.name,
          },
        },
      },
      data: {
        action: 'unenroll',
        students: [(await getUserInfo(userId)).email || 'Unknown'],
        courseId,
      },
    };
    await db.appEvent.create({
      data: eventData,
    });
  } catch (error) {
    logger.error(error);
    if (eventData) {
      createIssue('Failed to create app event', JSON.stringify(eventData, null, 2));
    }
  }

  return res.status(200).json({
    result: 'success',
    message: 'User unenrolled',
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), [
  'update:courses',
  'update:users',
]);
