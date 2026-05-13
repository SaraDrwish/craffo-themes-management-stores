import express from 'express';
import { get, all, run } from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { theme_id, platform, search, plan } = req.query;
  let sql = `
    SELECT sl.*, t.name as theme_name
    FROM store_links sl
    JOIN themes t ON sl.theme_id = t.id
    WHERE sl.is_approved = 1
  `;
  const params = [];
  if (theme_id) { sql += ` AND sl.theme_id = ?`; params.push(theme_id); }
  if (platform && (platform === 'Salla' || platform === 'Zid')) { sql += ` AND sl.platform = ?`; params.push(platform); }
  if (plan && (plan === 'starter' || plan === 'growth' || plan === 'gold')) { sql += ` AND sl.plan = ?`; params.push(plan); }
  if (search && search.trim() !== '') { sql += ` AND (sl.store_name LIKE ? OR sl.store_url LIKE ?)`; const like = `%${search}%`; params.push(like, like); }
  sql += ` ORDER BY sl.store_name ASC`;
  const links = await all(sql, params);
  res.json(links);
});

router.get('/:id', async (req, res) => {
  const link = await get(`SELECT sl.*, t.name as theme_name FROM store_links sl JOIN themes t ON sl.theme_id = t.id WHERE sl.id = ?`, [req.params.id]);
  if (!link) return res.status(404).json({ error: 'Store link not found' });
  res.json(link);
});

router.post('/', verifyAdmin, async (req, res) => {
  const { theme_id, store_name, store_url, platform, plan } = req.body;
  if (!theme_id || !store_name || !store_url || !platform) {
    return res.status(400).json({ error: 'Missing required fields: theme_id, store_name, store_url, platform' });
  }
  try {
    const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
    if (!themeExists) return res.status(404).json({ error: 'Theme not found' });
    const existing = await get('SELECT id FROM store_links WHERE store_url = ?', [store_url]);
    if (existing) return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً' });
    const finalPlan = (plan && plan !== 'none') ? plan : null;
    const result = await run(`INSERT INTO store_links (theme_id, store_name, store_url, platform, plan, is_approved) VALUES (?, ?, ?, ?, ?, 1)`, [theme_id, store_name, store_url, platform, finalPlan]);
    res.status(201).json({ id: result.lastID, success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create store link' });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { theme_id, store_name, store_url, platform, plan, is_approved } = req.body;
  const current = await get('SELECT store_url, theme_id FROM store_links WHERE id = ?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Store link not found' });
  if (store_url && store_url !== current.store_url) {
    const existing = await get('SELECT id FROM store_links WHERE store_url = ? AND id != ?', [store_url, req.params.id]);
    if (existing) return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً' });
  }
  if (theme_id && theme_id !== current.theme_id) {
    const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
    if (!themeExists) return res.status(404).json({ error: 'New theme not found' });
  }
  const updates = [], values = [];
  if (theme_id !== undefined) { updates.push('theme_id = ?'); values.push(theme_id); }
  if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
  if (store_url !== undefined) { updates.push('store_url = ?'); values.push(store_url); }
  if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
  if (plan !== undefined) { updates.push('plan = ?'); values.push((plan && plan !== 'none') ? plan : null); }
  if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await run(`UPDATE store_links SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true });
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await run('DELETE FROM store_links WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Store link not found' });
  res.json({ success: true });
});

export default router;