import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { get, all, run } from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Uploads folder created:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `store-${unique}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
  try {
    const links = await all(sql, params);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const linksWithImageUrl = links.map(link => ({
      ...link,
      image_url: link.image ? `${baseUrl}${link.image}` : null
    }));
    res.json(linksWithImageUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ في جلب البيانات' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const link = await get(`SELECT sl.*, t.name as theme_name FROM store_links sl JOIN themes t ON sl.theme_id = t.id WHERE sl.id = ?`, [req.params.id]);
    if (!link) return res.status(404).json({ error: 'المتجر غير موجود' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    link.image_url = link.image ? `${baseUrl}${link.image}` : null;
    res.json(link);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

// POST – إضافة متجر مع صورة
router.post('/', verifyAdmin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ error: 'خطأ في رفع الصورة: ' + err.message });
    }
    const { theme_id, store_name, store_url, platform, plan } = req.body;
    console.log('📥 Received:', { theme_id, store_name, store_url, platform, plan, file: req.file });

    if (!theme_id || !store_name || !store_url || !platform) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    try {
      const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
      if (!themeExists) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'الثيم غير موجود' });
      }
      const existing = await get('SELECT id FROM store_links WHERE store_url = ?', [store_url]);
      if (existing) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(409).json({ error: 'هذا الرابط موجود مسبقاً' });
      }
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const finalPlan = (plan && plan !== 'none') ? plan : null;
      const result = await run(`
        INSERT INTO store_links (theme_id, store_name, store_url, platform, plan, image, is_approved)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [theme_id, store_name.trim(), store_url.trim(), platform, finalPlan, imagePath]);

      res.status(201).json({ id: result.lastID, success: true });
    } catch (error) {
      console.error('❌ DB error:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'حدث خطأ في الخادم: ' + error.message });
    }
  });
});

// PUT – تعديل متجر مع صورة اختيارية
router.put('/:id', verifyAdmin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'خطأ في رفع الصورة' });
    const { theme_id, store_name, store_url, platform, plan, is_approved } = req.body;
    try {
      const current = await get('SELECT store_url, theme_id, image FROM store_links WHERE id = ?', [req.params.id]);
      if (!current) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'المتجر غير موجود' });
      }
      if (store_url && store_url !== current.store_url) {
        const existing = await get('SELECT id FROM store_links WHERE store_url = ? AND id != ?', [store_url, req.params.id]);
        if (existing) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(409).json({ error: 'الرابط موجود مسبقاً' });
        }
      }
      if (theme_id && theme_id !== current.theme_id) {
        const themeExists = await get('SELECT id FROM themes WHERE id = ?', [theme_id]);
        if (!themeExists) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: 'الثيم الجديد غير موجود' });
        }
      }
      let imagePath = current.image;
      if (req.file) {
        if (current.image && fs.existsSync(path.join(__dirname, '..', current.image))) {
          fs.unlinkSync(path.join(__dirname, '..', current.image));
        }
        imagePath = `/uploads/${req.file.filename}`;
      }
      const updates = [], values = [];
      if (theme_id !== undefined) { updates.push('theme_id = ?'); values.push(theme_id); }
      if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
      if (store_url !== undefined) { updates.push('store_url = ?'); values.push(store_url); }
      if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
      if (plan !== undefined) { updates.push('plan = ?'); values.push((plan && plan !== 'none') ? plan : null); }
      if (imagePath !== undefined) { updates.push('image = ?'); values.push(imagePath); }
      if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
      if (updates.length === 0) return res.status(400).json({ error: 'لا توجد بيانات' });
      values.push(req.params.id);
      await run(`UPDATE store_links SET ${updates.join(', ')} WHERE id = ?`, values);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'حدث خطأ في التحديث' });
    }
  });
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const store = await get('SELECT image FROM store_links WHERE id = ?', [req.params.id]);
    if (store && store.image && fs.existsSync(path.join(__dirname, '..', store.image))) {
      fs.unlinkSync(path.join(__dirname, '..', store.image));
    }
    const result = await run('DELETE FROM store_links WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'المتجر غير موجود' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في الحذف' });
  }
});

export default router;