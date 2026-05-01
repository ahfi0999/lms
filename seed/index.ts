import { faker } from '@faker-js/faker';
import db from '../lib/db';
import logger from '../lib/logger';
import { Course } from '@prisma/client';

async function createACourse(index: number) {
  // Create a course
  const course = await db.course.create({
    data: {
      title: faker.science.chemicalElement().name,
      contentLink: 'https://devops.lms.digitallync.ai',
      description: faker.lorem.words(3),
      picture: `/img/courses/thumb (${index + 1}).webp`,
      liveLink: faker.internet.url(),
    },
  });

  logger.info(course, 'Created course: ');

  // Create modules
  const modules = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      return db.module.create({
        data: {
          title: faker.lorem.words(2),
          course: {
            connect: {
              id: course.id,
            },
          },
          topics: {
            createMany: {
              data: Array.from({ length: faker.number.int({ min: 3, max: 5 }) }).map(() => ({
                title: faker.lorem.words(2),
                videoLink: 'https://player.vimeo.com/video/825331658',
              })),
            },
          },
        },
      });
    })
  );

  // Update course
  await db.course.update({
    where: {
      id: course.id,
    },
    data: {
      modulesOrder: {
        set: modules.map((m) => m.id).sort((a, b) => a - b),
      },
    },
  });

  return course;
}

async function createUsers() {
  // Create 10 users with admin role
}

async function createAUser(courses: Course[]) {
  // Create a user
}

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  if (dbUrl.pathname === '/lms-production' || process.env.MODE === 'production') {
    logger.info('Cannot seed in production');
    return;
  }
  // Create 10 courses
  const courses = await Promise.all(
    Array.from({ length: 10 }).map((_, index) => createACourse(index))
  );
  // Create users
  await createUsers();
  // Create a dev user
  await createAUser(courses);
}

main()
  .then(() => {
    logger.info('Done!');
  })
  .catch((error) => logger.error(error));
