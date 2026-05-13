import express from 'express';
import { get, all, run } from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { platform, plan, search } = req.query;
  let sql = `
    SELECT t.*,
      (SELECT COUNT(*) FROM store_links sl WHERE sl.theme_id = t.id AND sl.is_approved = 1) as stores_count
    FROM themes t
    WHERE t.is_hidden = 0
  `;
  const params = [];
  if (platform && (platform === 'Salla' || platform === 'Zid')) { sql += ` AND t.platform = ?`; params.push(platform); }
  if (plan && ['starter', 'growth', 'gold'].includes(plan)) { sql += ` AND t.plan = ?`; params.push(plan); }
  if (search && search.trim() !== '') { sql += ` AND (t.name LIKE ? OR t.description LIKE ?)`; const like = `%${search}%`; params.push(like, like); }
  sql += ` ORDER BY t.is_pinned DESC, t.order_index ASC, t.id DESC`;
  try {
    const themes = await all(sql, params);
    res.json(themes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const theme = await get('SELECT * FROM themes WHERE id = ?', [req.params.id]);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });
    const stores = await all(`SELECT id, store_name, store_url, platform, plan FROM store_links WHERE theme_id = ? AND is_approved = 1 ORDER BY store_name ASC`, [theme.id]);
    res.json({ ...theme, stores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verifyAdmin, async (req, res) => {
  const { platform, name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned } = req.body;
  try {
    const result = await run(`
      INSERT INTO themes (platform, name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned, is_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [platform, name, image, description, price, demo_url, purchase_url, plan || 'starter', order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0]);
    res.status(201).json({ id: result.lastID });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Theme already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { name, image, description, price, demo_url, purchase_url, plan, order_index, is_hidden, is_pinned } = req.body;
  try {
    await run(`
      UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, plan=?, order_index=?, is_hidden=?, is_pinned=?, is_modified=1, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `, [name, image, description, price, demo_url, purchase_url, plan, order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM themes WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Theme not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reset-api', verifyAdmin, async (req, res) => {
  try {
    const theme = await get('SELECT original_api_data FROM themes WHERE id = ?', [req.params.id]);
    if (!theme || !theme.original_api_data) return res.status(400).json({ error: 'No API data to reset' });
    const original = JSON.parse(theme.original_api_data);
    await run(`UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, plan=?, is_modified=0, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [original.name, original.image, original.description, original.price, original.demo_url, original.purchase_url, original.plan || 'starter', req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reorder', verifyAdmin, async (req, res) => {
  const { direction } = req.body;
  if (!direction || !['up', 'down'].includes(direction)) return res.status(400).json({ error: 'Direction must be "up" or "down"' });
  try {
    const current = await get('SELECT order_index FROM themes WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Theme not found' });
    const targetOrder = direction === 'up' ? current.order_index - 1 : current.order_index + 1;
    await run('UPDATE themes SET order_index = ? WHERE order_index = ? AND id != ?', [current.order_index, targetOrder, req.params.id]);
    await run('UPDATE themes SET order_index = ? WHERE id = ?', [targetOrder, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;