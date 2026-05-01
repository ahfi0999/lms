import db from '../db';
import { idSchema } from '../schemas/zod-schemas';

export const getCourseDataForAdminPage = async (courseId: number) => {
  const data = await db.course.findUniqueOrThrow({
    where: {
      id: idSchema.parse(courseId),
    },
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      liveLink: true,
      archived: true,
      contentLink: true,
      modulesOrder: true,
      resourceFiles: {
        select: {
          id: true,
          title: true,
          description: true,
          file: true,
        },
      },
      projectFiles: {
        select: {
          id: true,
          title: true,
          description: true,
          file: true,
        },
      },
      modules: {
        select: {
          _count: true,
          id: true,
          title: true,
          updatedAt: true,
          topics: {
            select: {
              id: true,
              title: true,
              videoLink: true,
              attachments: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  file: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    ...data,
    modules: data.modules.map((module) => ({
      ...module,
      updatedAt: module.updatedAt.toISOString(),
    })),
  };
};
