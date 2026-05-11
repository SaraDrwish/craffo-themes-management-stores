import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { theme_id } = req.query;
  let query = `SELECT c.*, (SELECT COUNT(*) FROM store_links sl WHERE sl.category_id = c.id AND sl.is_approved = 1) as stores_count FROM categories c`;
  const params = [];
  if (theme_id) { query += ` WHERE c.theme_id = ?`; params.push(theme_id); }
  query += ` ORDER BY c.name ASC`;
  const categories = await db.all(query, params);
  res.json(categories);
});

router.get('/:id', async (req, res) => {
  const category = await db.get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!category) return res.status(404).json({ error: 'Not found' });
  const stores = await db.all(`SELECT id, store_name, store_url, platform FROM store_links WHERE category_id = ? AND is_approved = 1`, [category.id]);
  res.json({ ...category, stores });
});

router.post('/', verifyAdmin, async (req, res) => {
  const { theme_id, name } = req.body;
  if (!theme_id || !name) return res.status(400).json({ error: 'Missing fields' });
  const existing = await db.get('SELECT id FROM categories WHERE theme_id = ? AND name = ?', [theme_id, name]);
  if (existing) return res.status(409).json({ error: 'Duplicate category' });
  const result = await db.run('INSERT INTO categories (theme_id, name) VALUES (?, ?)', [theme_id, name]);
  res.status(201).json({ id: result.lastID });
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const category = await db.get('SELECT theme_id FROM categories WHERE id = ?', [req.params.id]);
  if (!category) return res.status(404).json({ error: 'Not found' });
  const existing = await db.get('SELECT id FROM categories WHERE theme_id = ? AND name = ? AND id != ?', [category.theme_id, name, req.params.id]);
  if (existing) return res.status(409).json({ error: 'Duplicate' });
  await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;