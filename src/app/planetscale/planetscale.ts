import { connect } from '@planetscale/database'
import { bigint, datetime, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

// create the connection
const connection = connect({
  url: process.env.PLANETSCALE_URL,
})

export const planetscale = drizzle(connection)

export const accounts = mysqlTable('accounts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }),
  name: varchar('name', { length: 255 }),
  description: varchar('description', { length: 255 }),
  created_at: datetime('created_at'),
  updated_at: datetime('updated_at'),
})

export const posts = mysqlTable('posts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }),
  content: varchar('content', { length: 255 }),
  created_at: datetime('created_at'),
  updated_at: datetime('updated_at'),
})
