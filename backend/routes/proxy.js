import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMS_API_BASE = 'https://tms.craffo.com/api';

router.get('/categories', async (req, res) => {
  try {
    const response = await axios.get(`${TMS_API_BASE}/categories`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/themes', async (req, res) => {
  try {
    const response = await axios.get(`${TMS_API_BASE}/themes`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

export default router;