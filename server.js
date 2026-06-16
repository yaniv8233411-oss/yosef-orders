const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const ORDERS = path.join(__dirname, 'orders.json');
const PRIVATE_KEY = path.join(__dirname, 'qz-private-key.pem');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS, 'utf8') || '[]'); }
  catch (e) { return []; }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS, JSON.stringify(orders, null, 2));
}
function now() { return new Date().toISOString(); }

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/station.html', (req, res) => res.sendFile(path.join(__dirname, 'station.html')));

app.get('/api/orders', (req, res) => res.json({ ok: true, orders: readOrders() }));

app.post('/api/orders', (req, res) => {
  const orders = readOrders();
  const id = orders.reduce((m, o) => Math.max(m, Number(o.id) || 1000), 1000) + 1;
  const order = {
    id,
    createdAt: now(),
    updatedAt: now(),
    customer: req.body.customer || 'לקוח',
    phone: req.body.phone || '',
    items: req.body.items || '',
    notes: req.body.notes || '',
    type: req.body.type || 'איסוף עצמי',
    status: 'new',
    printed: false,
    printAttempts: 0,
    stationClaim: null
  };
  orders.unshift(order);
  writeOrders(orders);
  console.log('NEW_ORDER', JSON.stringify({ id: order.id, customer: order.customer, phone: order.phone, items: order.items }));
  res.json({ ok: true, order });
});

app.post('/api/orders/:id/claim', (req, res) => {
  const id = Number(req.params.id);
  const stationId = String(req.body.stationId || 'station');
  const orders = readOrders();
  const o = orders.find(x => Number(x.id) === id);
  if (!o) return res.status(404).json({ ok: false, claimed: false, reason: 'not_found' });
  if (o.printed || o.status === 'printed') return res.json({ ok: true, claimed: false, reason: 'already_printed', order: o });

  // If an old claim is stuck more than 2 minutes, release it.
  if (o.status === 'printing' && o.claimedAt) {
    const age = Date.now() - new Date(o.claimedAt).getTime();
    if (age > 120000) {
      o.status = 'new';
      o.stationClaim = null;
    }
  }
  if (o.status === 'printing') return res.json({ ok: true, claimed: false, reason: 'already_printing', order: o });

  o.status = 'printing';
  o.printed = false;
  o.claimedAt = now();
  o.stationClaim = stationId;
  o.printAttempts = (Number(o.printAttempts) || 0) + 1;
  o.updatedAt = now();
  writeOrders(orders);
  console.log('ORDER_CLAIMED', JSON.stringify({ id: o.id, status: o.status, attempts: o.printAttempts, stationId }));
  res.json({ ok: true, claimed: true, order: o });
});

app.post('/api/orders/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const orders = readOrders();
  const o = orders.find(x => Number(x.id) === id);
  if (!o) return res.status(404).json({ ok: false });
  if (req.body.status) o.status = req.body.status;
  if (typeof req.body.printed === 'boolean') o.printed = req.body.printed;
  if (req.body.printedAt) o.printedAt = req.body.printedAt;
  if (req.body.error) o.lastPrintError = req.body.error;
  o.updatedAt = now();
  writeOrders(orders);
  console.log('ORDER_STATUS', JSON.stringify({ id: o.id, status: o.status, printed: o.printed }));
  res.json({ ok: true, order: o });
});

app.post('/api/orders/:id/release', (req, res) => {
  const id = Number(req.params.id);
  const orders = readOrders();
  const o = orders.find(x => Number(x.id) === id);
  if (!o) return res.status(404).json({ ok: false });
  if (!o.printed && o.status === 'printing') {
    o.status = 'new';
    o.stationClaim = null;
    o.updatedAt = now();
    writeOrders(orders);
  }
  res.json({ ok: true, order: o });
});

// QZ Tray signed request endpoint.
app.post('/api/qz/sign', (req, res) => {
  try {
    const request = String(req.body.request || '');
    const key = fs.readFileSync(PRIVATE_KEY, 'utf8');
    const signer = crypto.createSign('RSA-SHA512');
    signer.update(request);
    signer.end();
    const signature = signer.sign(key, 'base64');
    res.json({ ok: true, signature });
  } catch (e) {
    console.error('QZ_SIGN_ERROR', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => console.log('Yosef Orders v3.0 ENTERPRISE server running on port ' + PORT));
