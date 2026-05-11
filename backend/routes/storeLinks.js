import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { category_id, theme_id, platform, search, plan } = req.query;
  let query = `
    SELECT sl.*, c.name as category_name, c.theme_id, t.name as theme_name, t.plan as theme_plan
    FROM store_links sl
    JOIN categories c ON sl.category_id = c.id
    JOIN themes t ON c.theme_id = t.id
    WHERE sl.is_approved = 1
  `;
  const params = [];
  if (category_id) { query += ` AND sl.category_id = ?`; params.push(category_id); }
  if (theme_id) { query += ` AND c.theme_id = ?`; params.push(theme_id); }
  if (platform) { query += ` AND sl.platform = ?`; params.push(platform); }
  if (plan && ['starter', 'growth', 'gold'].includes(plan)) { query += ` AND t.plan = ?`; params.push(plan); }
  if (search) { query += ` AND (sl.store_name LIKE ? OR sl.store_url LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  query += ` ORDER BY sl.store_name ASC`;
  const links = await db.all(query, params);
  res.json(links);
});

router.post('/', verifyAdmin, async (req, res) => {
  const { category_id, store_name, store_url, platform, is_approved = 1 } = req.body;
  if (!category_id || !store_name || !store_url || !platform) return res.status(400).json({ error: 'Missing fields' });
  const result = await db.run(`INSERT INTO store_links (category_id, store_name, store_url, platform, is_approved) VALUES (?,?,?,?,?)`, [category_id, store_name, store_url, platform, is_approved]);
  res.status(201).json({ id: result.lastID });
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { store_name, store_url, platform, category_id, is_approved } = req.body;
  const updates = [], values = [];
  if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
  if (store_url !== undefined) { updates.push('store_url = ?'); values.push(store_url); }
  if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
  if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
  if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields' });
  values.push(req.params.id);
  await db.run(`UPDATE store_links SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true });
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await db.run('DELETE FROM store_links WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;