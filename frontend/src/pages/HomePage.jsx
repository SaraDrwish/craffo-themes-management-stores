import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ThemeCard from '../components/ThemeCard';
import StoreCard from '../components/StoreCard';
import Filters from '../components/Filters';
import Footer from '../components/Footer';
import { getAllThemes, getAllStoreLinks } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [platform, setPlatform] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [themes, setThemes] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredThemes, setFilteredThemes] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false); // true if searching for a store name

  useEffect(() => {
    loadThemesAndStores();
  }, [platform, planFilter]);

  async function loadThemesAndStores() {
    setLoading(true);
    const plan = planFilter === 'all' ? null : planFilter;
    const platformParam = platform === 'all' ? null : platform;
    const themesData = await getAllThemes(platformParam, plan);
    setThemes(themesData);
    // جلب كل المتاجر (بدون فلتر) لعرضها عند البحث
    const storesData = await getAllStoreLinks({ platform: platformParam });
    setStores(storesData);
    setFilteredThemes(themesData);
    setFilteredStores([]);
    setSearchMode(false);
    setLoading(false);
  }

  useEffect(() => {
    if (!search.trim()) {
      setFilteredThemes(themes);
      setFilteredStores([]);
      setSearchMode(false);
      return;
    }
    const lowerSearch = search.toLowerCase();
    // البحث في الثيمات
    const matchedThemes = themes.filter(theme =>
      theme.name.toLowerCase().includes(lowerSearch) ||
      (theme.description && theme.description.toLowerCase().includes(lowerSearch))
    );
    // البحث في المتاجر
    const matchedStores = stores.filter(store =>
      store.store_name.toLowerCase().includes(lowerSearch) ||
      (store.theme_name && store.theme_name.toLowerCase().includes(lowerSearch))
    );
    setFilteredThemes(matchedThemes);
    setFilteredStores(matchedStores);
    setSearchMode(matchedStores.length > 0);
  }, [search, themes, stores]);

  // إذا كان هناك نتائج متاجر، نعرضها فقط (مع إمكانية عرض مختلط، حسب رغبتك – هنا نعرض المتاجر كأولوية)
  const showStoresOnly = searchMode && filteredStores.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex justify-center gap-6 mb-8">
          <button onClick={() => setPlatform('all')} className={`px-6 py-2 rounded-full font-bold transition ${platform === 'all' ? 'bg-dark-navy text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>الكل</button>
          <button onClick={() => setPlatform('Salla')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${platform === 'Salla' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>
            <img src="https://asas-tools.com/u/uploads/sara_craffo/sallah-logo.png" alt="Salla" className="w-6 h-6" /> سلة
          </button>
          <button onClick={() => setPlatform('Zid')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${platform === 'Zid' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>
            <img src="https://asas-tools.com/u/uploads/sara_craffo/zid-logo.png" alt="Zid" className="w-6 h-6" /> زد
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {[
            { value: 'all', label: '🎯 الكل' },
            { value: 'starter', label: '🚀 باقة الانطلاق' },
            { value: 'growth', label: '🌟 باقة النمو' },
            { value: 'gold', label: '👑 الباقة الذهبية' }
          ].map(plan => (
            <button key={plan.value} onClick={() => setPlanFilter(plan.value)} className={`px-4 py-1 rounded-full text-sm font-semibold transition ${planFilter === plan.value ? 'bg-dark-navy text-white' : 'bg-gray-200 text-dark-navy hover:bg-purplelight'}`}>{plan.label}</button>
          ))}
        </div>

        <Filters search={search} setSearch={setSearch} placeholder="ابحث باسم الثيم أو المتجر..." />

        {loading ? (
          <div className="text-center py-20">جاري التحميل...</div>
        ) : (
          <>
            {showStoresOnly && (
              <div>
                <h2 className="text-xl font-bold text-dark-navy mb-4 mt-6">نتائج البحث عن المتاجر</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStores.map(store => <StoreCard key={store.id} store={store} />)}
                </div>
              </div>
            )}
            {!showStoresOnly && filteredThemes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-dark-navy mb-4 mt-6">الثيمات</h2>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredThemes.map(theme => (
                      <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <ThemeCard theme={theme} platform={theme.platform} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
            {!showStoresOnly && filteredThemes.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-500">لا توجد نتائج مطابقة</div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}