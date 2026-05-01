import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { idSchema, updateModuleSchema } from '../../../lib/schemas/zod-schemas';
import db from '../../../lib/db';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['DELETE', 'PUT'].includes(z.string().parse(req.method))) {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const moduleId = idSchema.parse(req.query.moduleId);

  if (req.method === 'DELETE') {
    return DELETE(req, res, moduleId);
  }

  if (req.method === 'PUT') {
    return PUT(req, res, moduleId);
  }
}

async function DELETE(req: NextApiRequest, res: NextApiResponse, moduleId: number) {
  const module = await db.module.findUnique({
    where: {
      id: moduleId,
    },
    select: {
      courseId: true,
    },
  });

  if (!module) {
    return res.status(404).json({
      message: 'Module not found',
    });
  }

  await db.$transaction(async (tx) => {
    // Delete the module
    await tx.module.delete({
      where: {
        id: moduleId,
      },
    });

    // Delete all topics in this module
    await tx.topic.deleteMany({
      where: {
        moduleId,
      },
    });

    // Update the course to reflect the new module order
    const course = await tx.course.findUniqueOrThrow({
      where: {
        id: module.courseId,
      },
      select: {
        modulesOrder: true,
      },
    });

    const newModulesOrder = course.modulesOrder.filter((id) => id !== moduleId);
    const updatedCourse = await tx.course.update({
      where: {
        id: module.courseId,
      },
      data: {
        modulesOrder: newModulesOrder,
      },
    });

    return updatedCourse;
  });

  return res.status(200).json({
    message: 'Module deleted',
  });
}

async function PUT(req: NextApiRequest, res: NextApiResponse, moduleId: number) {
  const data = updateModuleSchema.parse(req.body);
  await db.$transaction(async (tx) => {
    const module = await tx.module.findUnique({
      where: {
        id: moduleId,
      },
      select: {
        topics: {
          select: {
            id: true,
            title: true,
            videoLink: true,
          },
        },
      },
    });

    if (!module) {
      return res.status(404).json({
        message: 'Module not found',
      });
    }

    // Update the module
    // New topics to create which don't have an id
    const newTopicsToCreate = data.topics.filter((topic) => !topic.id);
    // Existing topics to update which have an id
    const existingTopicsToUpdate = data.topics.filter((topic) => topic.id);
    // Topics to delete which are in the database but not in the request
    const topicsToDelete = module.topics.filter(
      (topic) => !data.topics.find((t) => t.id === topic.id)
    );

    const updatedModule = await tx.module.update({
      where: {
        id: moduleId,
      },
      data: {
        title: data.title,
        topics: {
          createMany: {
            data: newTopicsToCreate.map((i) => ({
              title: i.title,
              videoLink: i.videoLink,
            })),
          },
          deleteMany: {
            id: {
              in: topicsToDelete.map((i) => i.id),
            },
          },
        },
      },
    });

    for (const topic of existingTopicsToUpdate) {
      await tx.topic.update({
        where: {
          id: topic.id,
        },
        data: {
          title: topic.title,
          videoLink: topic.videoLink,
        },
      });
    }

    // Delete the attachments of the topics to delete
    for (const topic of topicsToDelete) {
      await tx.attachment.deleteMany({
        where: {
          topicId: topic.id,
        },
      });
      // TODO: Delete the files from the storage
    }

    return updatedModule;
  });

  return res.status(200).json({
    message: 'Module updated',
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
