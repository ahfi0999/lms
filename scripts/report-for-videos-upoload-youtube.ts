// @ts-nocheck
// TODO: This file is not being used, WIP.
import { createWriteStream } from 'fs';
import { db } from '../common/db';
import csv from 'csv-stringify';
import path from 'path';

async function main() {
  const topics = await db.topic.findMany({
    where: {
      modulesId: {
        not: null,
      },
    },
  });

  const data = topics.map((t) => ({
    ...t,
    videoLink: t.videoLink?.includes('vimeo')
      ? t.videoLink
      : `https://www.youtube.com/watch?v=${t.videoLink}`,
  }));

  // write to csv
  const fsWriteStream = createWriteStream(
    path.join(__dirname, 'data/report-for-videos-upoload-youtube.csv'),
    'utf-8'
  );

  csv.stringify(data, { header: true }, (err, output) => {
    if (err) {
      console.log(err);
      return;
    }
    fsWriteStream.write(output);
  });
}

main();
