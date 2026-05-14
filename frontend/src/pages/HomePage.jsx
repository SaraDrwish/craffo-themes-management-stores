import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ThemeCard from '../components/ThemeCard';
import StoreCard from '../components/StoreCard';
import Filters from '../components/Filters';
import Footer from '../components/Footer';
import { getAllThemes, getAllStoreLinks } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../components/SearchableSelect';

// استيراد Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// استيراد الأنماط الأساسية لـ Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('stores');
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [themesList, setThemesList] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [storePlatformFilter, setStorePlatformFilter] = useState('all');
  const [storePlanFilter, setStorePlanFilter] = useState('all');
  const [storeSearch, setStoreSearch] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [latestStores, setLatestStores] = useState([]);
  const [platform, setPlatform] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [themes, setThemes] = useState([]);
  const [filteredThemes, setFilteredThemes] = useState([]);
  const [themeSearch, setThemeSearch] = useState('');
  const [loadingThemes, setLoadingThemes] = useState(true);

  async function loadLatestStores() {
    try {
      const res = await getAllStoreLinks({ limit: 12 });
      setLatestStores(res);
    } catch (err) {
      console.error('Failed to load latest stores', err);
    }
  }

  useEffect(() => {
    if (activeTab === 'stores') {
      setSelectedThemeId('');
      setStorePlatformFilter('all');
      setStorePlanFilter('all');
      setStoreSearch('');
      loadStoresData();
      loadLatestStores();
    }
  }, [activeTab]);

  async function loadStoresData() {
    setLoadingStores(true);
    const themesData = await getAllThemes();
    setThemesList(themesData);
    let filters = {};
    if (selectedThemeId) filters.theme_id = selectedThemeId;
    if (storePlatformFilter !== 'all') filters.platform = storePlatformFilter;
    if (storePlanFilter !== 'all') filters.plan = storePlanFilter;
    if (storeSearch) filters.search = storeSearch;
    const storesData = await getAllStoreLinks(filters);
    setStores(storesData);
    setFilteredStores(storesData);
    setLoadingStores(false);
  }

  useEffect(() => {
    if (activeTab === 'stores') loadStoresData();
  }, [selectedThemeId, storePlatformFilter, storePlanFilter, storeSearch]);

  useEffect(() => {
    if (activeTab === 'themes') loadThemesData();
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
    if (!themeSearch.trim()) { setFilteredThemes(themes); return; }
    const lower = themeSearch.toLowerCase();
    const filtered = themes.filter(t => t.name.toLowerCase().includes(lower) || (t.description && t.description.toLowerCase().includes(lower)));
    setFilteredThemes(filtered);
  }, [themeSearch, themes]);

  const resetStoreFilters = () => {
    setSelectedThemeId('');
    setStorePlatformFilter('all');
    setStorePlanFilter('all');
    setStoreSearch('');
  };

  const themeOptions = themesList.map(theme => ({ value: theme.id, label: theme.name }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex justify-center gap-6 mb-8">
          <button onClick={() => setActiveTab('stores')} className={`px-8 py-2 rounded-full font-bold transition ${activeTab === 'stores' ? 'bg-dark-navy text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>جميع المتاجر</button>
          <button onClick={() => setActiveTab('themes')} className={`px-8 py-2 rounded-full font-bold transition ${activeTab === 'themes' ? 'bg-dark-navy text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>الثيمات</button>
        </div>

        {activeTab === 'stores' && (
          <>
            {latestStores.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-dark-navy mb-6 text-center">أحدث المتاجر المضافة</h2>
                <Swiper
                  modules={[Autoplay, Navigation, Pagination]}
                  spaceBetween={16}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 4 }
                  }}
                  loop={true}
                  autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                  }}
                  navigation={true}
                  pagination={{ clickable: true }}
                  className="store-carousel"
                  style={{ padding: '0 0 40px 0' }}
                >
                  {latestStores.map(store => (
                    <SwiperSlide key={store.id}>
                      <StoreCard store={store} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* باقي الفلاتر */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { value: 'all', label: 'الكل' },
                { value: 'Salla', label: ' سلة' },
                { value: 'Zid', label: 'زد' }
              ].map(filter => (
                <button key={filter.value} onClick={() => setStorePlatformFilter(filter.value)} className={`px-4 py-1 rounded-full text-sm font-semibold transition ${storePlatformFilter === filter.value ? 'bg-dark-navy text-white' : 'bg-gray-200 text-dark-navy hover:bg-purplelight'}`}>{filter.label}</button>
              ))}
            </div>
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { value: 'all', label: ' كل الباقات' },
                { value: 'starter', label: ' باقة الانطلاق' },
                { value: 'growth', label: ' باقة النمو' },
                { value: 'gold', label: ' الباقة الذهبية' }
              ].map(plan => (
                <button key={plan.value} onClick={() => setStorePlanFilter(plan.value)} className={`px-4 py-1 rounded-full text-sm font-semibold transition ${storePlanFilter === plan.value ? 'bg-dark-navy text-white' : 'bg-gray-200 text-dark-navy hover:bg-purplelight'}`}>{plan.label}</button>
              ))}
            </div>
            <div className="flex justify-center gap-4 mb-6 flex-wrap">
              <div className="w-64">
                <SearchableSelect
                  options={themeOptions}
                  value={selectedThemeId}
                  onChange={setSelectedThemeId}
                  placeholder="كل الثيمات"
                />
              </div>
              <button onClick={resetStoreFilters} className="px-4 py-2 rounded-full bg-purple text-white hover:bg-dark-navy transition">إعادة تعيين الفلاتر</button>
            </div>
            <Filters search={storeSearch} setSearch={setStoreSearch} placeholder="ابحث باسم المتجر أو الرابط..." />
            {loadingStores ? <div className="text-center py-20">جاري التحميل...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">{filteredStores.map(store => <StoreCard key={store.id} store={store} />)}</div>
            )}
            {!loadingStores && filteredStores.length === 0 && <div className="text-center py-20 text-gray-500">لا توجد متاجر مطابقة</div>}
          </>
        )}

        {activeTab === 'themes' && (
          <>
            <div className="flex justify-center gap-6 mb-8">
              <button onClick={() => setPlatform('all')} className={`px-6 py-2 rounded-full font-bold transition ${platform === 'all' ? 'bg-dark-navy text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}>الكل</button>
              <button onClick={() => setPlatform('Salla')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${platform === 'Salla' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}><img src="https://asas-tools.com/u/uploads/sara_craffo/sallah-logo.png" alt="Salla" className="w-6 h-6" /> سلة</button>
              <button onClick={() => setPlatform('Zid')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition ${platform === 'Zid' ? 'bg-purple text-white shadow-lg' : 'bg-light-mauve text-dark-navy'}`}><img src="https://asas-tools.com/u/uploads/sara_craffo/zid-logo.png" alt="Zid" className="w-6 h-6" /> زد</button>
            </div>
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { value: 'all', label: ' الكل' },
                { value: 'starter', label: 'باقة الانطلاق' },
                { value: 'growth', label: ' باقة النمو' },
                { value: 'gold', label: ' الباقة الذهبية' }
              ].map(plan => <button key={plan.value} onClick={() => setPlanFilter(plan.value)} className={`px-4 py-1 rounded-full text-sm font-semibold transition ${planFilter === plan.value ? 'bg-dark-navy text-white' : 'bg-gray-200 text-dark-navy hover:bg-purplelight'}`}>{plan.label}</button>)}
            </div>
            <Filters search={themeSearch} setSearch={setThemeSearch} placeholder="ابحث باسم الثيم..." />
            {loadingThemes ? <div className="text-center py-20">جاري التحميل...</div> : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <AnimatePresence>
                  {filteredThemes.map(theme => <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ThemeCard theme={theme} platform={theme.platform} /></motion.div>)}
                </AnimatePresence>
              </motion.div>
            )}
            {!loadingThemes && filteredThemes.length === 0 && <div className="text-center py-20 text-gray-500">لا توجد ثيمات مطابقة</div>}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}