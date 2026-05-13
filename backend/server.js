import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import themeRoutes from './routes/themes.js';
import storeLinkRoutes from './routes/storeLinks.js';
import adminRoutes from './routes/admin.js';
import { fetchTmsThemesAndCategories } from './services/tmsApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/store-links', storeLinkRoutes);
app.use('/api/admin', adminRoutes);

setTimeout(async () => {
  console.log('🔄 Syncing themes from API...');
  await fetchTmsThemesAndCategories();
}, 3000);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`🔐 Admin login: http://localhost:${config.port}/admin-login`);
});