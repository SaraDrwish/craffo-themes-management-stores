import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import themeRoutes from './routes/themes.js';
import categoryRoutes from './routes/categories.js';
import storeLinkRoutes from './routes/storeLinks.js';
import adminRoutes from './routes/admin.js';
import { fetchTmsThemesAndCategories } from './services/tmsApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (after build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/store-links', storeLinkRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For any other route, serve the frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Initial sync of themes from API after server starts
setTimeout(async () => {
  console.log('🔄 Performing initial sync from TMS API...');
  const result = await fetchTmsThemesAndCategories();
  if (result.success) {
    console.log(`✅ Initial sync completed: ${result.themesCount} themes loaded`);
  } else {
    console.error('❌ Initial sync failed:', result.error);
  }
}, 3000);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server is running on http://localhost:${config.port}`);
  console.log(`🔐 Admin login: http://localhost:${config.port}/admin-login`);
  console.log(`👤 Default admin: ${config.adminUsername} / ${config.adminPassword}`);
});