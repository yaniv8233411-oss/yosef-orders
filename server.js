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
function readOrders(){try{return JSON.parse(fs.readFileSync(ORDERS,'utf8')||'[]')}catch(e){return []}}
function writeOrders(o){fs.writeFileSync(ORDERS, JSON.stringify(o,null,2));}
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/station.html',(req,res)=>res.sendFile(path.join(__dirname,'station.html')));
app.get('/api/orders',(req,res)=>res.json(readOrders()));
app.post('/api/orders',(req,res)=>{let orders=readOrders(); let id=(orders.reduce((m,o)=>Math.max(m,o.id||1000),1000)+1); let order={id, createdAt:new Date().toISOString(), status:'new', printed:false, ...req.body}; orders.unshift(order); writeOrders(orders); console.log('NEW_ORDER', JSON.stringify({id:order.id, customer:order.customer, phone:order.phone, items:order.items})); res.json({ok:true, order});});
app.post('/api/orders/:id/status',(req,res)=>{let id=Number(req.params.id); let orders=readOrders(); let o=orders.find(x=>x.id===id); if(!o) return res.status(404).json({ok:false}); Object.assign(o, req.body); writeOrders(orders); console.log('ORDER_STATUS', JSON.stringify({id:o.id,status:o.status,printed:o.printed})); res.json({ok:true, order:o});});
app.listen(PORT,()=>console.log('Yosef Orders v2.1 server running on port '+PORT));
