const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.YOSEF_TOKEN || 'yosef';
const DATA_FILE = path.join(__dirname, 'orders.json');
const INDEX_FILE = path.join(__dirname, 'index.html');

function load(){
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e){ return []; }
}
function save(orders){ fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf8'); }
function send(res, code, data, type='application/json'){
  res.writeHead(code, {
    'Content-Type': type + '; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type,x-yosef-token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}
function authed(req, url){
  return (req.headers['x-yosef-token'] || url.searchParams.get('token') || 'yosef') === TOKEN;
}
function getIps(){
  const nets = os.networkInterfaces();
  const out=[];
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    }
  }
  return out;
}
function readBody(req){
  return new Promise((resolve, reject)=>{
    let body='';
    req.on('data', chunk=> body += chunk);
    req.on('end', ()=> resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req,res)=>{
  try{
    if(req.method === 'OPTIONS') return send(res,200,{});
    const url = new URL(req.url, 'http://localhost');

    if(url.pathname === '/' || url.pathname === '/index.html'){
      return send(res,200,fs.readFileSync(INDEX_FILE,'utf8'),'text/html');
    }
    if(url.pathname === '/health') return send(res,200,{ok:true, version:'1.6', ips:getIps()});
    if(!authed(req,url)) return send(res,403,{ok:false,error:'bad token'});

    if(url.pathname === '/api/orders' && req.method === 'GET'){
      return send(res,200,load().sort((a,b)=>Number(b.number||0)-Number(a.number||0)));
    }
    if(url.pathname === '/api/orders' && req.method === 'POST'){
      const input = JSON.parse((await readBody(req)) || '{}');
      const orders = load();
      const max = orders.reduce((m,o)=>Math.max(m, Number(o.number)||1000), 1000);
      const order = {
        id: Date.now(),
        number: max + 1,
        created: new Date().toLocaleString('he-IL'),
        printed: false,
        status: 'חדש',
        items: input.items || '',
        notes: input.notes || '',
        type: input.type || 'איסוף',
        name: input.name || 'ללא שם',
        phone: input.phone || '',
        time: input.time || '',
        urgent: input.urgent || 'רגיל',
        address: input.address || '',
        floor: input.floor || '',
        door: input.door || '',
        deliveryNotes: input.deliveryNotes || '',
        payment: input.payment || 'מזומן',
        paymentNotes: input.paymentNotes || ''
      };
      orders.push(order); save(orders);
      return send(res,200,{ok:true,order});
    }
    if(url.pathname.startsWith('/api/orders/') && url.pathname.endsWith('/printed') && req.method === 'POST'){
      const id = Number(url.pathname.split('/')[3]);
      const orders = load();
      const o = orders.find(x=>Number(x.id)===id || Number(x.number)===id);
      if(!o) return send(res,404,{ok:false,error:'order not found'});
      o.printed = true; o.status = 'הודפס'; o.printedAt = new Date().toLocaleString('he-IL'); save(orders);
      return send(res,200,{ok:true,order:o});
    }
    if(url.pathname.startsWith('/api/orders/') && url.pathname.endsWith('/unprinted') && req.method === 'POST'){
      const id = Number(url.pathname.split('/')[3]);
      const orders = load();
      const o = orders.find(x=>Number(x.id)===id || Number(x.number)===id);
      if(!o) return send(res,404,{ok:false,error:'order not found'});
      o.printed = false; o.status = 'חדש'; save(orders);
      return send(res,200,{ok:true,order:o});
    }
    return send(res,404,{ok:false,error:'not found'});
  } catch(e){ send(res,500,{ok:false,error:e.message}); }
});
server.listen(PORT,'0.0.0.0',()=>{
  console.log('Yosef Orders v1.6 server running on port ' + PORT);
  console.log('Open station on this PC: http://localhost:' + PORT + '/?station=1');
  getIps().forEach(ip=>console.log('Open phone on same WiFi: http://' + ip + ':' + PORT + '/'));
});
