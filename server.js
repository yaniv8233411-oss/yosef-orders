const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
const DB = path.join(__dirname, 'orders.json');
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.use(express.static(__dirname));
function load(){try{return JSON.parse(fs.readFileSync(DB,'utf8')||'[]')}catch(e){return []}}
function save(x){fs.writeFileSync(DB, JSON.stringify(x,null,2),'utf8')}
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/station', (req,res)=>res.sendFile(path.join(__dirname,'station.html')));
app.get('/api/orders', (req,res)=>res.json({ok:true,orders:load()}));
app.post('/api/orders', (req,res)=>{
  const orders=load();
  const next = orders.length ? Math.max(...orders.map(o=>o.id||1000))+1 : 1001;
  const o={id:next, createdAt:new Date().toISOString(), status:'new', printed:false, ...req.body};
  orders.unshift(o); save(orders); res.json({ok:true,order:o});
});
app.post('/api/orders/:id/status',(req,res)=>{const id=+req.params.id; const orders=load(); const o=orders.find(x=>x.id===id); if(!o)return res.status(404).json({ok:false,error:'not found'}); Object.assign(o, req.body); save(orders); res.json({ok:true,order:o});});
app.listen(PORT, ()=>console.log(`Yosef Orders v1.7 server running on port ${PORT}`));
