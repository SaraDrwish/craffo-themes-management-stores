import express from 'express';
import db from '../db.js';
import { verifyAdmin } from '../middleware/auth.js';
import { fetchTmsThemesAndCategories } from '../services/tmsApi.js';

const router = express.Router();

router.get('/stats', verifyAdmin, async (req, res) => {
  const themes = await db.get('SELECT COUNT(*) as count FROM themes');
  const stores = await db.get('SELECT COUNT(*) as count FROM store_links WHERE is_approved = 1');
  res.json({ themes: themes.count, stores: stores.count });
});

router.post('/sync-now', verifyAdmin, async (req, res) => {
  const result = await fetchTmsThemesAndCategories();
  res.json(result);
});

export default router;