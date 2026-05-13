import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ThemeCard from '../components/ThemeCard';
import Filters from '../components/Filters';
import Footer from '../components/Footer';
import { getAllThemes } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [platform, setPlatform] = useState('Salla');
  const [planFilter, setPlanFilter] = useState('all');
  const [themes, setThemes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThemes();
  }, [platform, planFilter]);

  async function loadThemes() {
    setLoading(true);
    const plan = planFilter === 'all' ? null : planFilter;
    const data = await getAllThemes(platform, plan);
    setThemes(data);
    setFiltered(data);
    setLoading(false);
  }

  useEffect(() => {
    if (!search) {
      setFiltered(themes);
      return;
    }
    const filteredData = themes.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    );
    setFiltered(filteredData);
  }, [search, themes]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Platform Tabs */}
        <div className="flex justify-center gap-6 mb-8">
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

        {/* Plan Filter */}
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

        <Filters search={search} setSearch={setSearch} />

        {loading ? (
          <div className="text-center py-20">جاري التحميل...</div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <AnimatePresence>
              {filtered.map(theme => (
                <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <ThemeCard theme={theme} platform={platform} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-20 text-gray-500">لا توجد ثيمات مطابقة</div>}
      </div>
      <Footer />
    </div>
  );
}