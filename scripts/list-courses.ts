import db from '../lib/db';

async function main() {
  const rows = await db.course.findMany({
    select: { id: true, title: true, picture: true, archived: true },
    orderBy: { id: 'asc' },
  });
  console.log(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
