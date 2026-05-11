import axios from 'axios';
import db from '../db.js';
import { config } from '../config.js';

export async function fetchSallaThemes() {
  try {
    if (!config.sallaApiKey) return { success: false, error: 'No API key' };
    const response = await axios.get('https://api.salla.dev/v2/themes', {
      headers: { Authorization: `Bearer ${config.sallaApiKey}` }
    });
    const themes = response.data.data || [];
    const craffoThemes = themes.filter(t => t.vendor?.name?.toLowerCase().includes('craffo'));
    for (const theme of craffoThemes) {
      const existing = db.prepare('SELECT id, is_modified FROM themes WHERE platform = "Salla" AND external_id = ?').get(theme.id);
      const apiData = {
        name: theme.name,
        image: theme.cover_image,
        description: theme.description,
        price: theme.price?.amount?.toString(),
        demo_url: theme.demo_url,
        purchase_url: theme.purchase_url
      };
      if (!existing) {
        db.prepare(`INSERT INTO themes (platform, external_id, name, image, description, price, demo_url, purchase_url, original_api_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('Salla', theme.id, apiData.name, apiData.image, apiData.description, apiData.price, apiData.demo_url, apiData.purchase_url, JSON.stringify(apiData));
      } else if (!existing.is_modified) {
        db.prepare(`UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, original_api_data=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
          .run(apiData.name, apiData.image, apiData.description, apiData.price, apiData.demo_url, apiData.purchase_url, JSON.stringify(apiData), existing.id);
      }
    }
    return { success: true, count: craffoThemes.length };
  } catch (error) {
    console.error('Salla API error:', error.message);
    return { success: false, error: error.message };
  }
}