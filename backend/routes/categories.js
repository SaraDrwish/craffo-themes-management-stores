import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET جميع الفئات
router.get('/', async (req, res) => {
  const { theme_id } = req.query;
  let sql = `SELECT c.*, (SELECT COUNT(*) FROM store_links sl WHERE sl.category_id = c.id AND sl.is_approved = 1) as stores_count FROM categories c`;
  const params = [];
  if (theme_id) {
    sql += ` WHERE c.theme_id = ?`;
    params.push(theme_id);
  }
  sql += ` ORDER BY c.name ASC`;
  try {
    const categories = await db.all(sql, params);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET فئة معينة
router.get('/:id', async (req, res) => {
  try {
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const stores = await db.all(`SELECT id, store_name, store_url, platform, plan FROM store_links WHERE category_id = ? AND is_approved = 1`, [category.id]);
    res.json({ ...category, stores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST إنشاء فئة
router.post('/', verifyAdmin, async (req, res) => {
  const { theme_id, name } = req.body;
  if (!theme_id || !name) return res.status(400).json({ error: 'theme_id and name required' });
  try {
    const existing = await db.get('SELECT id FROM categories WHERE theme_id = ? AND name = ?', [theme_id, name]);
    if (existing) return res.status(409).json({ error: 'Category name already exists for this theme' });
    const result = await db.run('INSERT INTO categories (theme_id, name) VALUES (?, ?)', [theme_id, name]);
    res.status(201).json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT تعديل فئة
router.put('/:id', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const category = await db.get('SELECT theme_id FROM categories WHERE id = ?', [req.params.id]);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const existing = await db.get('SELECT id FROM categories WHERE theme_id = ? AND name = ? AND id != ?', [category.theme_id, name, req.params.id]);
    if (existing) return res.status(409).json({ error: 'Duplicate category name' });
    await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE حذف فئة
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;