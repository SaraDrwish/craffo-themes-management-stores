import express from 'express';
import { importDiscordLinks } from '../services/discordService.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/import', verifyAdmin, async (req, res) => {
  const result = await importDiscordLinks();
  res.json(result);
});

export default router;