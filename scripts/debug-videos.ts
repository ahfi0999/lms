import db from '../lib/db';

async function main() {
  const courses = await db.course.findMany({
    select: {
      id: true,
      title: true,
      modules: {
        select: {
          id: true,
          title: true,
          topics: {
            select: { id: true, title: true, videoLink: true },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  for (const c of courses) {
    console.log(`\n=== Course ${c.id}: ${c.title} ===`);
    if (c.modules.length === 0) {
      console.log('  (no modules)');
      continue;
    }
    for (const m of c.modules) {
      console.log(`  Module ${m.id}: ${m.title} (${m.topics.length} topics)`);
      for (const t of m.topics) {
        const link = t.videoLink ? t.videoLink : '(NO videoLink)';
        console.log(`    Topic ${t.id}: ${t.title} → ${link}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
