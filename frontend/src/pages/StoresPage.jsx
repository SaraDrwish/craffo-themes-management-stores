import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StoreCard from '../components/StoreCard';
import { getAllStoreLinks } from '../services/api';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadStores(); }, [planFilter]);

  async function loadStores() {
    setLoading(true);
    const filters = {};
    if (planFilter !== 'all') filters.plan = planFilter;
    const data = await getAllStoreLinks(filters);
    setStores(data);
    setFilteredStores(data);
    setLoading(false);
  }

  useEffect(() => {
    if (!search) { setFilteredStores(stores); return; }
    const filtered = stores.filter(store => store.store_name.toLowerCase().includes(search.toLowerCase()) || store.store_url.toLowerCase().includes(search.toLowerCase()) || (store.theme_name && store.theme_name.toLowerCase().includes(search.toLowerCase())));
    setFilteredStores(filtered);
  }, [search, stores]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-3xl font-bold text-center text-dark-navy mb-6">جميع المتاجر المستخدمة لثيماتنا</h1>
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
        <div className="flex justify-center">
          <input type="text" placeholder="ابحث باسم المتجر أو الرابط أو الثيم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-md border border-purplelight rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple" />
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