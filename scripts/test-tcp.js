const net = require('net');
const s = net.createConnection({ host: 'localhost', port: 4000 }, () => {
  console.log('CONNECTED');
  s.end();
});
s.on('error', (e) => {
  console.error('ERR', e.code, e.message);
  process.exit(0);
});
setTimeout(() => process.exit(0), 3000);
