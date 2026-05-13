import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Prisma } from '@prisma/client';
import db from '../../../../lib/db';
import logger from '../../../../lib/logger';
import { idSchema } from '../../../../lib/schemas/zod-schemas';
import { getSessionOrThrow } from '../../../../lib/auth-utils';
import { createIssue } from '../../../../lib/linear';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';

const batchUnenrollSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const courseIdResult = idSchema.safeParse(req.query.courseId);
  if (!courseIdResult.success) {
    return res.status(400).json({ result: 'error', message: 'Invalid course ID' });
  }
  const courseId = courseIdResult.data;

  const bodyResult = batchUnenrollSchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ result: 'error', message: 'Invalid request body' });
  }
  const { userIds } = bodyResult.data;

  const { user } = await getSessionOrThrow(req, res);

  let course: { users: string[] };
  try {
    course = await db.course.findUniqueOrThrow({
      where: { id: courseId },
      select: { users: true },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Unable to fetch course' });
  }

  try {
    await db.course.update({
      where: { id: courseId },
      data: {
        users: { set: course.users.filter((id) => !userIds.includes(id)) },
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Unable to unenroll users' });
  }

  logger.info(`Batch unenrolled ${userIds.length} users from course ${courseId}`);

  let eventData: Prisma.AppEventCreateInput | undefined;
  try {
    eventData = {
      type: 'COURSE_ACCESS',
      user: {
        connectOrCreate: {
          where: { id: user.sub },
          create: { id: user.sub, email: user.email, name: user.name },
        },
      },
      data: { action: 'batch-unenroll', students: userIds, courseId },
    };
    await db.appEvent.create({ data: eventData });
  } catch (error) {
    logger.error(error);
    if (eventData) {
      createIssue('Failed to create app event', JSON.stringify(eventData, null, 2));
    }
  }

  return res.status(200).json({
    result: 'success',
    message: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} unenrolled`,
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), [
  'update:courses',
  'update:users',
]);
