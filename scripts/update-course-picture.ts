import db from '../lib/db';

const [, , title, picturePath] = process.argv;

if (!title || !picturePath) {
  console.error('Usage: tsx scripts/update-course-picture.ts <title> <picturePath>');
  process.exit(1);
}

async function main() {
  const result = await db.course.updateMany({
    where: { title },
    data: { picture: picturePath },
  });
  console.log(`Updated ${result.count} course row(s) with title="${title}".`);
  const row = await db.course.findFirst({
    where: { title },
    select: { id: true, title: true, picture: true },
  });
  console.log('After:', row);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
