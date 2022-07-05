import {DB_PATH} from 'constants/env';
import {Database, open} from 'sqlite';
import sqlite3 from 'sqlite3';

export const openDb = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  await db.run('PRAGMA journal_mode = WAL;');
  return db;
};
