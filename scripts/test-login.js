const fetch = globalThis.fetch || require('node-fetch');
(async ()=>{
  const url = 'http://127.0.0.1:5000/api/auth/login';
  try{
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'user@example.com', password: 'password123' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  }catch(e){
    console.error('ERR', e.message || e);
  }
})();
