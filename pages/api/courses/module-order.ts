import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import { moduleOrderChangeSchema } from '../../../lib/schemas/zod-schemas';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { source, destination, courseId } = moduleOrderChangeSchema.parse(req.body);
  await db.$transaction(async (tx) => {
    const course = await tx.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },
      select: {
        archived: true,
        modulesOrder: true,
      },
    });

    // TODO: Implement lastAccessedAt update for modules to prevent user from updating modulesOrder based on old data
    if (Math.max(source, destination) >= course.modulesOrder.length) {
      return res.status(400).json({
        message: 'Invalid source or destination',
      });
    }

    const newModulesOrder = [...course.modulesOrder];
    newModulesOrder[source] = course.modulesOrder[destination];
    newModulesOrder[destination] = course.modulesOrder[source];
    // Swap modules in array
    await tx.course.update({
      where: {
        id: courseId,
      },
      data: {
        modulesOrder: newModulesOrder,
      },
    });
  });

  return res.status(200).json({
    message: 'Course updated',
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
