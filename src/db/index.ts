import { Pool, QueryResult, QueryResultRow } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables desde .env local
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

console.log('=== ARCHIVO DB CARGADO ===')


const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
})

console.log('=== POOL CREADO CON USUARIO ADMIN ===')

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params)
  } catch (err) {
    console.error('Database query error', { text, params, err })
    throw err
  }
}

export default pool