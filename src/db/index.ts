import { Pool, QueryResult, QueryResultRow } from 'pg'

console.log('=== ARCHIVO DB CARGADO ===')


const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
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