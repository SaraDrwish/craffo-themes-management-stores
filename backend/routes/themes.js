import express from 'express';
import { get, all, run } from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all themes with search on theme name, description, and store names
router.get('/', async (req, res) => {
  const { platform, plan, search } = req.query;
  let sql = `
    SELECT DISTINCT t.*,
      (SELECT COUNT(*) FROM store_links sl WHERE sl.theme_id = t.id AND sl.is_approved = 1) as stores_count
    FROM themes t
    LEFT JOIN store_links sl ON sl.theme_id = t.id AND sl.is_approved = 1
    WHERE t.is_hidden = 0
  `;
  const params = [];
  if (platform && (platform === 'Salla' || platform === 'Zid')) {
    sql += ` AND t.platform = ?`;
    params.push(platform);
  }
  if (plan && ['starter', 'growth', 'gold'].includes(plan)) {
    sql += ` AND t.plan = ?`;
    params.push(plan);
  }
  if (search && search.trim() !== '') {
    sql += ` AND (t.name LIKE ? OR t.description LIKE ? OR sl.store_name LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY t.is_pinned DESC, t.order_index ASC, t.id DESC`;
  const themes = await all(sql, params);
  res.json(themes);
});

router.get('/:id', async (req, res) => {
  const theme = await get('SELECT * FROM themes WHERE id = ?', [req.params.id]);
  if (!theme) return res.status(404).json({ error: 'Theme not found' });
  const stores = await all(`SELECT id, store_name, store_url, platform, plan, image FROM store_links WHERE theme_id = ? AND is_approved = 1 ORDER BY store_name ASC`, [theme.id]);
  // إضافة رابط الصورة الكامل للمتجر
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const storesWithImageUrl = stores.map(store => ({
    ...store,
    image_url: store.image ? `${baseUrl}${store.image}` : null
  }));
  res.json({ ...theme, stores: storesWithImageUrl });
});

router.post('/', verifyAdmin, async (req, res) => {
  const { platform, name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned } = req.body;
  const finalPlan = (plan && plan !== 'none') ? plan : null;
  try {
    const result = await run(`
      INSERT INTO themes (platform, name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned, is_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [platform, name, image, description, price, demo_url, purchase_url, finalPlan, order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0]);
    res.status(201).json({ id: result.lastID });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Theme already exists' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned } = req.body;
  const finalPlan = (plan && plan !== 'none') ? plan : null;
  try {
    await run(`
      UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, plan=?, order_index=?, is_hidden=?, is_pinned=?, is_modified=1, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [name, image, description, price, demo_url, purchase_url, finalPlan, order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await run('DELETE FROM themes WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Theme not found' });
  res.json({ success: true });
});

router.post('/:id/reset-api', verifyAdmin, async (req, res) => {
  const theme = await get('SELECT original_api_data FROM themes WHERE id = ?', [req.params.id]);
  if (!theme || !theme.original_api_data) return res.status(400).json({ error: 'No API data to reset' });
  const original = JSON.parse(theme.original_api_data);
  const originalPlan = (original.plan && original.plan !== 'none') ? original.plan : null;
  await run(`
    UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, plan=?, is_modified=0, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `, [original.name, original.image, original.description, original.price, original.demo_url, original.purchase_url, originalPlan, req.params.id]);
  res.json({ success: true });
});

router.post('/:id/reorder', verifyAdmin, async (req, res) => {
  const { direction } = req.body;
  if (!direction || !['up', 'down'].includes(direction)) return res.status(400).json({ error: 'Direction must be "up" or "down"' });
  const current = await get('SELECT order_index FROM themes WHERE id = ?', [req.params.id]);
  const targetOrder = direction === 'up' ? current.order_index - 1 : current.order_index + 1;
  await run('UPDATE themes SET order_index = ? WHERE order_index = ? AND id != ?', [current.order_index, targetOrder, req.params.id]);
  await run('UPDATE themes SET order_index = ? WHERE id = ?', [targetOrder, req.params.id]);
  res.json({ success: true });
});

export default router;