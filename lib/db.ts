// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line import/no-mutable-exports
let db: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient();
} else {
  const newGlobalAny: any = global;
  if (!newGlobalAny.db) {
    newGlobalAny.db = new PrismaClient();
  }
  db = newGlobalAny.db;
}

export default db;
