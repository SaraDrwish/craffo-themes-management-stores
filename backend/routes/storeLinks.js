import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET store links
router.get('/', async (req, res) => {
  const { category_id, theme_id, platform, search, plan } = req.query;
  let query = `
    SELECT sl.*, c.name as category_name, c.theme_id, t.name as theme_name
    FROM store_links sl
    JOIN categories c ON sl.category_id = c.id
    JOIN themes t ON c.theme_id = t.id
    WHERE sl.is_approved = 1
  `;
  const params = [];
  if (category_id) { query += ` AND sl.category_id = ?`; params.push(category_id); }
  if (theme_id) { query += ` AND c.theme_id = ?`; params.push(theme_id); }
  if (platform) { query += ` AND sl.platform = ?`; params.push(platform); }
  if (plan && ['starter', 'growth', 'gold'].includes(plan)) { query += ` AND sl.plan = ?`; params.push(plan); }
  if (search) { query += ` AND (sl.store_name LIKE ? OR sl.store_url LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  query += ` ORDER BY sl.store_name ASC`;
  const links = await db.all(query, params);
  res.json(links);
});

// POST create store link (admin) - مع التحقق من التكرار
router.post('/', verifyAdmin, async (req, res) => {
  const { category_id, store_name, store_url, platform, plan, is_approved = 1 } = req.body;
  if (!category_id || !store_name || !store_url || !platform) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // التحقق من تكرار الرابط
    const existing = await db.get('SELECT id FROM store_links WHERE store_url = ?', [store_url]);
    if (existing) {
      return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً. يرجى استخدام رابط آخر.' });
    }
    const result = await db.run(`
      INSERT INTO store_links (category_id, store_name, store_url, platform, plan, is_approved)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [category_id, store_name, store_url, platform, plan || 'starter', is_approved]);
    res.status(201).json({ id: result.lastID, success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create store link' });
  }
});

// PUT update store link (admin) - مع التحقق من التكرار (تجاهل نفس الرابط)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { store_name, store_url, platform, category_id, plan, is_approved } = req.body;
  try {
    const current = await db.get('SELECT store_url FROM store_links WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Store link not found' });
    
    // إذا تم تغيير الرابط، تأكد من عدم تكراره
    if (store_url && store_url !== current.store_url) {
      const existing = await db.get('SELECT id FROM store_links WHERE store_url = ? AND id != ?', [store_url, req.params.id]);
      if (existing) {
        return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً.' });
      }
    }
    
    const updates = [], values = [];
    if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
    if (store_url !== undefined) { updates.push('store_url = ?'); values.push(store_url); }
    if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
    if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
    if (plan !== undefined) { updates.push('plan = ?'); values.push(plan); }
    if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    await db.run(`UPDATE store_links SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update store link' });
  }
});

// DELETE store link
router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await db.run('DELETE FROM store_links WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;