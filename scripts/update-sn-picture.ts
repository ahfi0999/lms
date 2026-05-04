import db from '../lib/db';

async function main() {
  const result = await db.course.updateMany({
    where: { title: 'sn' },
    data: { picture: '/img/courses/servicenow.png' },
  });
  console.log(`Updated ${result.count} course row(s).`);
  const row = await db.course.findFirst({
    where: { title: 'sn' },
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
