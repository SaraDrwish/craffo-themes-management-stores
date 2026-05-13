import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ThemeCard from '../components/ThemeCard';
import StoreCard from '../components/StoreCard';
import Filters from '../components/Filters';
import Footer from '../components/Footer';
import { getAllThemes, getAllStoreLinks } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'themes'
  
  // State for stores view
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [themesList, setThemesList] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [storePlanFilter, setStorePlanFilter] = useState('all');
  const [storeSearch, setStoreSearch] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);

  // State for themes view
  const [platform, setPlatform] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [themes, setThemes] = useState([]);
  const [filteredThemes, setFilteredThemes] = useState([]);
  const [themeSearch, setThemeSearch] = useState('');
  const [loadingThemes, setLoadingThemes] = useState(true);

  // Load data for stores view
  useEffect(() => {
    if (activeTab === 'stores') {
      loadStoresData();
    }
  }, [activeTab, selectedThemeId, storePlanFilter]);

  async function loadStoresData() {
    setLoadingStores(true);
    const themesData = await getAllThemes();
    setThemesList(themesData);
    let filters = {};
    if (selectedThemeId) filters.theme_id = selectedThemeId;
    if (storePlanFilter !== 'all') filters.plan = storePlanFilter;
    const storesData = await getAllStoreLinks(filters);
    setStores(storesData);
    setFilteredStores(storesData);
    setLoadingStores(false);
  }

  useEffect(() => {
    if (!storeSearch.trim()) {
      setFilteredStores(stores);
      return;
    }
    const lower = storeSearch.toLowerCase();
    const filtered = stores.filter(s =>
      s.store_name.toLowerCase().includes(lower) ||
      s.store_url.toLowerCase().includes(lower) ||
      (s.theme_name && s.theme_name.toLowerCase().includes(lower))
    );
    setFilteredStores(filtered);
  }, [storeSearch, stores]);

  // Load data for themes view
  useEffect(() => {
    if (activeTab === 'themes') {
      loadThemesData();
    }
  }, [activeTab, platform, planFilter]);

  async function loadThemesData() {
    setLoadingThemes(true);
    const platformParam = platform === 'all' ? null : platform;
    const planParam = planFilter === 'all' ? null : planFilter;
    const themesData = await getAllThemes(platformParam, planParam);
    setThemes(themesData);
    setFilteredThemes(themesData);
    setLoadingThemes(false);
  }

  useEffect(() => {
    if (!themeSearch.trim()) {
      setFilteredThemes(themes);
      return;
    }
    const lower = themeSearch.toLowerCase();
    const filtered = themes.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      (t.description && t.description.toLowerCase().includes(lower))
    );
    setFilteredThemes(filtered);
  }, [themeSearch, themes]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Tabs */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-8 py-2 rounded-full font-bold transition ${
              activeTab === 'stores'
                ? 'bg-dark-navy text-white shadow-lg'
                : 'bg-light-mauve text-dark-navy'
            }`}
          >
            جميع المتاجر
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-8 py-2 rounded-full font-bold transition ${
              activeTab === 'themes'
                ? 'bg-dark-navy text-white shadow-lg'
                : 'bg-light-mauve text-dark-navy'
            }`}
          >
            الثيمات
          </button>
        </div>

        {/* ========== Stores Tab ========== */}
        {activeTab === 'stores' && (
          <>
            {/* Filter by plan */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { value: 'all', label: '🎯 كل الباقات' },
                { value: 'starter', label: '🚀 باقة الانطلاق' },
                { value: 'growth', label: '🌟 باقة النمو' },
                { value: 'gold', label: '👑 الباقة الذهبية' }
              ].map(plan => (
                <button
                  key={plan.value}
                  onClick={() => setStorePlanFilter(plan.value)}
                  className={`px-4 py-1 rounded-full text-sm font-semibold transition ${
                    storePlanFilter === plan.value
                      ? 'bg-dark-navy text-white'
                      : 'bg-gray-200 text-dark-navy hover:bg-purplelight'
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>

            {/* Filter by theme - Dropdown */}
            <div className="flex justify-center mb-6">
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                className="px-4 py-2 rounded-full border border-purplelight bg-white text-dark-navy focus:outline-none focus:ring-2 focus:ring-purple transition cursor-pointer"
              >
                <option value="">كل الثيمات</option>
                {themesList.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <Filters
              search={storeSearch}
              setSearch={setStoreSearch}
              placeholder="ابحث باسم المتجر أو الرابط..."
            />

            {loadingStores ? (
              <div className="text-center py-20">جاري التحميل...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {filteredStores.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
            {!loadingStores && filteredStores.length === 0 && (
              <div className="text-center py-20 text-gray-500">لا توجد متاجر مطابقة</div>
            )}
          </>
        )}

        {/* ========== Themes Tab ========== */}
        {activeTab === 'themes' && (
          <>
            {/* Platform filters */}
            <div className="flex justify-center gap-6 mb-8">
              <button
                onClick={() => setPlatform('all')}
                className={`px-6 py-2 rounded-full font-bold transition ${
                  platform === 'all' ? 'bg-dark-navy text-white shadow-lg' : 'bg-light-mauve text-dark-navy'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setPlatform('Salla')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${
                  platform === 'Salla' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'
                }`}
              >
                <img src="https://asas-tools.com/u/uploads/sara_craffo/sallah-logo.png" alt="Salla" className="w-6 h-6" />
                سلة
              </button>
              <button
                onClick={() => setPlatform('Zid')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${
                  platform === 'Zid' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'
                }`}
              >
                <img src="https://asas-tools.com/u/uploads/sara_craffo/zid-logo.png" alt="Zid" className="w-6 h-6" />
                زد
              </button>
            </div>

            {/* Plan filter */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { value: 'all', label: '🎯 الكل' },
                { value: 'starter', label: '🚀 باقة الانطلاق' },
                { value: 'growth', label: '🌟 باقة النمو' },
                { value: 'gold', label: '👑 الباقة الذهبية' }
              ].map(plan => (
                <button
                  key={plan.value}
                  onClick={() => setPlanFilter(plan.value)}
                  className={`px-4 py-1 rounded-full text-sm font-semibold transition ${
                    planFilter === plan.value
                      ? 'bg-dark-navy text-white'
                      : 'bg-gray-200 text-dark-navy hover:bg-purplelight'
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <Filters search={themeSearch} setSearch={setThemeSearch} placeholder="ابحث باسم الثيم..." />

            {loadingThemes ? (
              <div className="text-center py-20">جاري التحميل...</div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <AnimatePresence>
                  {filteredThemes.map(theme => (
                    <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ThemeCard theme={theme} platform={theme.platform} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
            {!loadingThemes && filteredThemes.length === 0 && (
              <div className="text-center py-20 text-gray-500">لا توجد ثيمات مطابقة</div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}