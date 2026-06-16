const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const DB = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function loadOrders() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8') || '[]'); }
  catch { return []; }
}
function saveOrders(orders) {
  fs.writeFileSync(DB, JSON.stringify(orders, null, 2), 'utf8');
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/station', (req, res) => res.redirect('/station.html'));
app.get('/station.html', (req, res) => res.sendFile(path.join(__dirname, 'station.html')));

app.get('/api/health', (req, res) => res.json({ ok: true, version: 'v2.0', time: new Date().toISOString() }));

app.get('/api/qz/cert', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(__dirname, 'qz-cert.pem'), 'utf8'));
});

app.post('/api/qz/sign', (req, res) => {
  try {
    const toSign = req.body.request || req.body.toSign || '';
    const key = fs.readFileSync(path.join(__dirname, 'qz-private-key.pem'), 'utf8');
    const signer = crypto.createSign('RSA-SHA512');
    signer.update(toSign);
    signer.end();
    res.type('text/plain').send(signer.sign(key, 'base64'));
  } catch (e) {
    console.error('QZ_SIGN_ERROR', e.message);
    res.status(500).type('text/plain').send('sign error');
  }
});
app.get('/api/orders', (req, res) => res.json({ ok: true, orders: loadOrders() }));

app.post('/api/orders', (req, res) => {
  const orders = loadOrders();
  const nextId = orders.length ? Math.max(...orders.map(o => Number(o.id) || 1000)) + 1 : 1001;
  const order = {
    id: nextId,
    createdAt: new Date().toISOString(),
    status: 'new',
    printed: false,
    customer: req.body.customer || '',
    phone: req.body.phone || '',
    items: req.body.items || '',
    notes: req.body.notes || '',
    type: req.body.type || 'איסוף עצמי'
  };
  orders.unshift(order);
  saveOrders(orders);
  console.log('NEW_ORDER', JSON.stringify({ id: order.id, customer: order.customer, phone: order.phone, items: order.items }));
  res.json({ ok: true, order });
});

app.post('/api/orders/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const orders = loadOrders();
  const order = orders.find(o => Number(o.id) === id);
  if (!order) return res.status(404).json({ ok: false, error: 'not found' });
  Object.assign(order, req.body);
  saveOrders(orders);
  console.log('ORDER_STATUS', JSON.stringify({ id: order.id, status: order.status, printed: order.printed }));
  res.json({ ok: true, order });
});

app.listen(PORT, () => console.log(`Yosef Orders v2.0 server running on port ${PORT}`));
