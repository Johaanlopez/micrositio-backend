import { createApp } from './app'
import { config } from './config'
import pool from './db';

console.log('✅ Pool importado en server.ts');

// Probar conexión
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Conexión a BD exitosa');
}).catch(err => {
  console.error('❌ Error conectando a BD:', err.message);
});

const app = createApp()

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} (env: ${config.nodeEnv})`)
})
