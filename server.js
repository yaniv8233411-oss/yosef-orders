const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;
const ORDERS = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json({limit:'1mb'}));
app.use(express.static(__dirname));

function readOrders(){
  try { return JSON.parse(fs.readFileSync(ORDERS,'utf8') || '[]'); }
  catch(e){ return []; }
}
function writeOrders(o){ fs.writeFileSync(ORDERS, JSON.stringify(o,null,2)); }

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/station.html', (req,res)=>res.sendFile(path.join(__dirname,'station.html')));
app.get('/api/orders', (req,res)=>res.json(readOrders()));

app.post('/api/orders', (req,res)=>{
  const orders = readOrders();
  const id = (orders.reduce((m,o)=>Math.max(m, Number(o.id)||1000), 1000) + 1);
  const order = {
    id,
    createdAt: new Date().toISOString(),
    status: 'new',
    printed: false,
    printAttempts: 0,
    ...req.body
  };
  orders.unshift(order);
  writeOrders(orders);
  console.log('NEW_ORDER', JSON.stringify({id:order.id, customer:order.customer, phone:order.phone, items:order.items}));
  res.json({ok:true, order});
});

// Atomic claim: only one station/tab can claim a new order for printing.
app.post('/api/orders/:id/claim', (req,res)=>{
  const id = Number(req.params.id);
  const orders = readOrders();
  const o = orders.find(x=>Number(x.id)===id);
  if(!o) return res.status(404).json({ok:false, claimed:false, reason:'not_found'});
  if(o.printed || o.status === 'printed') {
    return res.json({ok:true, claimed:false, reason:'already_printed', order:o});
  }
  if(o.status === 'printing') {
    return res.json({ok:true, claimed:false, reason:'already_printing', order:o});
  }
  o.status = 'printing';
  o.printed = false;
  o.claimedAt = new Date().toISOString();
  o.printAttempts = (Number(o.printAttempts)||0) + 1;
  writeOrders(orders);
  console.log('ORDER_CLAIMED', JSON.stringify({id:o.id, status:o.status, attempts:o.printAttempts}));
  res.json({ok:true, claimed:true, order:o});
});

app.post('/api/orders/:id/status', (req,res)=>{
  const id = Number(req.params.id);
  const orders = readOrders();
  const o = orders.find(x=>Number(x.id)===id);
  if(!o) return res.status(404).json({ok:false});
  Object.assign(o, req.body);
  o.updatedAt = new Date().toISOString();
  writeOrders(orders);
  console.log('ORDER_STATUS', JSON.stringify({id:o.id,status:o.status,printed:o.printed}));
  res.json({ok:true, order:o});
});

app.listen(PORT,()=>console.log('Yosef Orders v2.4 ULTIMATE server running on port '+PORT));
