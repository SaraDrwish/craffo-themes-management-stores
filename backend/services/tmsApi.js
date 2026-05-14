import axios from 'axios';
import { get, run, all } from '../db.js';

const TMS_API_BASE = 'https://tms.craffo.com/api';

export async function fetchTmsThemesAndCategories() {
  console.log(' Fetching themes from API...');
  try {
    const themesRes = await axios.get(`${TMS_API_BASE}/themes`);
    let themes = themesRes.data;
    if (!Array.isArray(themes)) themes = [];

    for (const theme of themes) {
      const platform = theme.platform === 'Zid' ? 'Zid' : 'Salla';
      const existing = await get('SELECT id, is_modified FROM themes WHERE external_id = ? AND platform = ?', [theme.id, platform]);
      const apiData = {
        name: theme.name,
        image: theme.image || theme.cover_image || '',
        description: theme.description || '',
        price: theme.price || '0',
        demo_url: theme.demo_url || '',
        purchase_url: theme.purchase_url || '',
        plan: theme.plan || 'starter'
      };
      if (!existing) {
        await run(`
          INSERT INTO themes (external_id, platform, name, image, description, price, demo_url, purchase_url, plan, original_api_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [theme.id, platform, apiData.name, apiData.image, apiData.description, apiData.price, apiData.demo_url, apiData.purchase_url, apiData.plan, JSON.stringify(apiData)]);
        console.log(`➕ Added theme: ${apiData.name}`);
      } else if (!existing.is_modified) {
        await run(`
          UPDATE themes SET name=?, image=?, description=?, price=?, demo_url=?, purchase_url=?, plan=?, original_api_data=?, updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `, [apiData.name, apiData.image, apiData.description, apiData.price, apiData.demo_url, apiData.purchase_url, apiData.plan, JSON.stringify(apiData), existing.id]);
        console.log(` Updated theme: ${apiData.name}`);
      }
    }
    console.log(`Synced ${themes.length} themes from API`);
    return { success: true, themesCount: themes.length };
  } catch (error) {
    console.error(' TMS API error:', error.message);
    return { success: false, error: error.message };
  }
}