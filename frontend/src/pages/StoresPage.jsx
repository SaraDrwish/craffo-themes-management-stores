import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StoreCard from '../components/StoreCard';
import { getAllStoreLinks, getAllThemes } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadThemesAndStores(); }, []);

  async function loadThemesAndStores() {
    setLoading(true);
    const themesData = await getAllThemes();
    setThemes(themesData);
    const storesData = await getAllStoreLinks();
    setStores(storesData);
    setFilteredStores(storesData);
    setLoading(false);
  }

  useEffect(() => {
    let filtered = [...stores];
    if (selectedThemeId) filtered = filtered.filter(store => store.theme_id === parseInt(selectedThemeId));
    if (planFilter !== 'all') filtered = filtered.filter(store => store.plan === planFilter);
    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(store =>
        store.store_name.toLowerCase().includes(lower) ||
        store.store_url.toLowerCase().includes(lower) ||
        (store.theme_name && store.theme_name.toLowerCase().includes(lower))
      );
    }
    setFilteredStores(filtered);
  }, [selectedThemeId, planFilter, search, stores]);

  const themeOptions = themes.map(theme => ({ value: theme.id, label: theme.name }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-3xl font-bold text-center text-dark-navy mb-6">جميع المتاجر المستخدمة</h1>
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <div className="w-64">
            <SearchableSelect
              options={themeOptions}
              value={selectedThemeId}
              onChange={setSelectedThemeId}
              placeholder="كل الثيمات"
            />
          </div>
        </div>
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {[
            { value: 'all', label: 'كل الباقات' },
            { value: 'starter', label: 'باقة الانطلاق' },
            { value: 'growth', label: ' باقة النمو' },
            { value: 'gold', label: ' الباقة الذهبية' }
          ].map(plan => <button key={plan.value} onClick={() => setPlanFilter(plan.value)} className={`px-4 py-1 rounded-full text-sm ${planFilter === plan.value ? 'bg-dark-navy text-white' : 'bg-gray-200'}`}>{plan.label}</button>)}
        </div>
        <div className="flex justify-center">
          <input type="text" placeholder="ابحث باسم المتجر أو الرابط..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-md border border-purplelight rounded-full px-4 py-2" />
        </div>
        {loading ? <div className="text-center py-20">جاري التحميل...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">{filteredStores.map(store => <StoreCard key={store.id} store={store} />)}</div>
        )}
        {!loading && filteredStores.length === 0 && <div className="text-center py-20 text-gray-500">لا توجد متاجر مطابقة</div>}
      </div>
      <Footer />
    </div>
  );
}