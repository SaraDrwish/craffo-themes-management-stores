import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========================
// 1. GET all themes (public) with filters
// ========================
router.get('/', async (req, res) => {
  try {
    const { platform, plan, category, search } = req.query;
    let sql = `
      SELECT DISTINCT
        t.*,
        (SELECT COUNT(*) FROM categories c WHERE c.theme_id = t.id) AS categories_count,
        (SELECT COUNT(*) FROM store_links sl 
         JOIN categories c ON sl.category_id = c.id 
         WHERE c.theme_id = t.id AND sl.is_approved = 1) AS stores_count
      FROM themes t
      LEFT JOIN categories c ON c.theme_id = t.id
      LEFT JOIN store_links sl ON sl.category_id = c.id
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
    if (category) {
      sql += ` AND c.name = ?`;
      params.push(category);
    }
    if (search && search.trim() !== '') {
      sql += ` AND (t.name LIKE ? OR t.description LIKE ? OR sl.store_name LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    sql += ` ORDER BY t.is_pinned DESC, t.order_index ASC, t.id DESC`;

    const themes = await db.all(sql, params);
    res.json(themes);
  } catch (error) {
    console.error('Error in GET /themes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 2. GET single theme by ID with categories and stores
// ========================
router.get('/:id', async (req, res) => {
  try {
    const theme = await db.get('SELECT * FROM themes WHERE id = ?', [req.params.id]);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    const categories = await db.all(`
      SELECT
        c.id,
        c.name,
        (
          SELECT json_group_array(
            json_object('id', sl.id, 'store_name', sl.store_name, 'store_url', sl.store_url)
          )
          FROM store_links sl
          WHERE sl.category_id = c.id AND sl.is_approved = 1
        ) AS stores
      FROM categories c
      WHERE c.theme_id = ?
      ORDER BY c.name ASC
    `, [theme.id]);

    const parsedCategories = (categories || []).map(cat => ({
      ...cat,
      stores: cat.stores ? JSON.parse(cat.stores) : []
    }));

    res.json({ ...theme, categories: parsedCategories });
  } catch (error) {
    console.error('Error in GET /themes/:id', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// 3. POST create new theme (admin only)
// ========================
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const {
      platform, name, image, description, price, demo_url, purchase_url,
      plan, order_index, is_hidden, is_pinned
    } = req.body;

    if (!platform || !name) {
      return res.status(400).json({ error: 'Platform and name are required' });
    }

    const result = await db.run(`
      INSERT INTO themes (
        platform, name, image, description, price, demo_url, purchase_url,
        plan, order_index, is_hidden, is_pinned, is_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      platform, name, image || null, description || null, price || null,
      demo_url || null, purchase_url || null, plan || 'starter',
      order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0
    ]);

    res.status(201).json({ id: result.lastID, success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Theme with same name and platform already exists' });
    }
    console.error('Error in POST /themes', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// ========================
// 4. PUT update theme (admin only)
// ========================
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, image, description, price, demo_url, purchase_url,
      plan, order_index, is_hidden, is_pinned
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existing = await db.get('SELECT id FROM themes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    await db.run(`
      UPDATE themes SET
        name = ?, image = ?, description = ?, price = ?,
        demo_url = ?, purchase_url = ?, plan = ?, order_index = ?,
        is_hidden = ?, is_pinned = ?, is_modified = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, image || null, description || null, price || null,
      demo_url || null, purchase_url || null, plan || 'starter',
      order_index || 0, is_hidden ? 1 : 0, is_pinned ? 1 : 0,
      id
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /themes/:id', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// ========================
// 5. DELETE theme (admin only) - cascades to categories & stores
// ========================
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM themes WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /themes/:id', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// ========================
// 6. POST reset theme to API original data (admin only)
// ========================
router.post('/:id/reset-api', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await db.get('SELECT original_api_data FROM themes WHERE id = ?', [id]);
    if (!theme || !theme.original_api_data) {
      return res.status(400).json({ error: 'No API data to reset' });
    }
    const original = JSON.parse(theme.original_api_data);
    await db.run(`
      UPDATE themes SET
        name = ?, image = ?, description = ?, price = ?,
        demo_url = ?, purchase_url = ?, plan = ?,
        is_modified = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      original.name, original.image || null, original.description || null, original.price || null,
      original.demo_url || null, original.purchase_url || null, original.plan || 'starter',
      id
    ]);
    res.json({ success: true, message: 'Theme reset to original API data' });
  } catch (error) {
    console.error('Error in POST /themes/:id/reset-api', error);
    res.status(500).json({ error: 'Failed to reset theme' });
  }
});

// ========================
// 7. POST reorder theme (admin only)
// ========================
router.post('/:id/reorder', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }

    const current = await db.get('SELECT order_index FROM themes WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const targetOrder = direction === 'up' ? current.order_index - 1 : current.order_index + 1;
    // Swap order_index with neighbor
    await db.run(
      'UPDATE themes SET order_index = ? WHERE order_index = ? AND id != ?',
      [current.order_index, targetOrder, id]
    );
    await db.run('UPDATE themes SET order_index = ? WHERE id = ?', [targetOrder, id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /themes/:id/reorder', error);
    res.status(500).json({ error: 'Failed to reorder theme' });
  }
});

export default router;