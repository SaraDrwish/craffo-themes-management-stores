import express from 'express';
import { get, all, run } from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all store links (with optional filters: theme_id, platform, search, plan)
router.get('/', async (req, res) => {
  const { theme_id, platform, search, plan } = req.query;
  let sql = `
    SELECT sl.*, t.name as theme_name
    FROM store_links sl
    JOIN themes t ON sl.theme_id = t.id
    WHERE sl.is_approved = 1
  `;
  const params = [];
  if (theme_id) {
    sql += ` AND sl.theme_id = ?`;
    params.push(theme_id);
  }
  if (platform && (platform === 'Salla' || platform === 'Zid')) {
    sql += ` AND sl.platform = ?`;
    params.push(platform);
  }
  if (plan && (plan === 'starter' || plan === 'growth' || plan === 'gold')) {
    sql += ` AND sl.plan = ?`;
    params.push(plan);
  }
  if (search && search.trim() !== '') {
    sql += ` AND (sl.store_name LIKE ? OR sl.store_url LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like);
  }
  sql += ` ORDER BY sl.store_name ASC`;
  try {
    const links = await all(sql, params);
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET single store link by ID
router.get('/:id', async (req, res) => {
  try {
    const link = await get(`
      SELECT sl.*, t.name as theme_name 
      FROM store_links sl 
      JOIN themes t ON sl.theme_id = t.id 
      WHERE sl.id = ?
    `, [req.params.id]);
    if (!link) return res.status(404).json({ error: 'Store link not found' });
    res.json(link);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST create new store link (admin only) – with duplicate URL prevention
router.post('/', verifyAdmin, async (req, res) => {
  const { theme_id, store_name, store_url, platform, plan } = req.body;
  if (!theme_id || !store_name || !store_url || !platform) {
    return res.status(400).json({ error: 'Missing required fields: theme_id, store_name, store_url, platform' });
  }
  try {
    // Check if theme exists
    const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
    if (!themeExists) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    // Check for duplicate URL
    const existing = await get('SELECT id FROM store_links WHERE store_url = ?', [store_url]);
    if (existing) {
      return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً. يرجى استخدام رابط آخر.' });
    }
    const finalPlan = (plan && plan !== 'none') ? plan : null;
    const result = await run(`
      INSERT INTO store_links (theme_id, store_name, store_url, platform, plan, is_approved)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [theme_id, store_name, store_url, platform, finalPlan]);
    res.status(201).json({ id: result.lastID, success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create store link' });
  }
});

// PUT update store link (admin only) – with duplicate URL prevention (ignore self)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { theme_id, store_name, store_url, platform, plan, is_approved } = req.body;
  try {
    const current = await get('SELECT store_url, theme_id FROM store_links WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Store link not found' });

    // Check duplicate URL (if changing)
    if (store_url && store_url !== current.store_url) {
      const existing = await get('SELECT id FROM store_links WHERE store_url = ? AND id != ?', [store_url, req.params.id]);
      if (existing) {
        return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً.' });
      }
    }
    // Check if new theme exists (if changing theme)
    if (theme_id && theme_id !== current.theme_id) {
      const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
      if (!themeExists) return res.status(404).json({ error: 'New theme not found' });
    }

    const updates = [];
    const values = [];
    if (theme_id !== undefined) { updates.push('theme_id = ?'); values.push(theme_id); }
    if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
    if (store_url !== undefined) { updates.push('store_url = ?'); values.push(store_url); }
    if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
    if (plan !== undefined) { 
      updates.push('plan = ?'); 
      values.push((plan && plan !== 'none') ? plan : null);
    }
    if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    await run(`UPDATE store_links SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update store link' });
  }
});

// DELETE store link (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await run('DELETE FROM store_links WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Store link not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete store link' });
  }
});

export default router;