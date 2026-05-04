import db from '../lib/db';

async function main() {
  const rows = await db.course.findMany({
    select: {
      id: true,
      title: true,
      archived: true,
      users: true,
      modules: { select: { _count: true } },
    },
    orderBy: { id: 'asc' },
  });
  for (const c of rows) {
    console.log({
      id: c.id,
      title: c.title,
      archived: c.archived,
      moduleCount: c.modules.length,
      users: c.users,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
