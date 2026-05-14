import { useState, useEffect } from 'react';
import { getThemeById } from '../services/api';
import { motion } from 'framer-motion';

const planLabels = {
  starter: ' باقة الانطلاق',
  growth: ' باقة النمو',
  gold: 'الباقة الذهبية'
};
const planColors = {
  starter: 'bg-green-500',
  growth: 'bg-blue-600',
  gold: 'bg-yellow-600'
};

export default function ThemeDetailModal({ themeId, onClose }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedMessage, setCopiedMessage] = useState('');

  useEffect(() => {
    getThemeById(themeId).then(data => {
      setTheme(data);
      setLoading(false);
    });
  }, [themeId]);

  const copyAllLinks = (stores) => {
    const urls = stores.map(s => s.store_url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopiedMessage(' تم نسخ جميع روابط المتاجر');
    setTimeout(() => setCopiedMessage(''), 2000);
  };

  if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-2xl">جاري التحميل...</div></div>;
  if (!theme) return null;
  const stores = theme.stores || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-navy">{theme.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          <img src={theme.image && theme.image.startsWith('http') ? theme.image : `https://tms.craffo.com/storage/${theme.image}`} alt={theme.name} className="w-full h-64 object-cover rounded-lg mb-4" onError={(e) => e.target.src = 'https://placehold.co/600x400?text=No+Preview'} />
          <p className="text-gray-600 mb-4">{theme.description}</p>
          <div className="mb-4 flex gap-4">
            {theme.demo_url && <a href={theme.demo_url} target="_blank" className="bg-purple text-white px-4 py-2 rounded-lg">عرض Demo</a>}
            {theme.purchase_url && <a href={theme.purchase_url} target="_blank" className="bg-dark-navy text-white px-4 py-2 rounded-lg">شراء الثيم</a>}
          </div>
          <h3 className="text-xl font-bold mt-6 mb-4">المتاجر المرتبطة بهذا الثيم</h3>
          {stores.length === 0 && <p className="text-gray-500">لا توجد متاجر مرتبطة بهذا الثيم حتى الآن.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map(store => {
              const themeImageUrl = theme.image && theme.image.startsWith('http') ? theme.image : `https://tms.craffo.com/storage/${theme.image}`;
              const storeImage = store.image_url || themeImageUrl || 'https://placehold.co/600x400?text=Store+Preview';
              return (
                <div key={store.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
                  <div className="relative h-32 bg-gray-100">
                    <img src={storeImage} alt={store.store_name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Store+Preview'} />
                    {store.plan && store.plan !== 'none' && (
                      <div className={`absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded-full font-bold ${planColors[store.plan]}`}>
                        {planLabels[store.plan]}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-lg">{store.store_name}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-purple text-sm">{store.platform}</span>
                      <div className="flex gap-2">
                        <a href={store.store_url} target="_blank" className="bg-purple text-white px-2 py-1 rounded text-xs">زيارة</a>
                        <button onClick={() => { navigator.clipboard.writeText(store.store_url); setCopiedMessage(' تم نسخ الرابط'); setTimeout(() => setCopiedMessage(''), 1500); }} className="border border-gray-300 text-gray-600 px-2 py-1 rounded text-xs">نسخ</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {stores.length > 0 && <button onClick={() => copyAllLinks(stores)} className="mt-6 w-full bg-purple text-white py-2 rounded-lg hover:bg-dark-navy transition">📋 نسخ جميع روابط المتاجر ({stores.length})</button>}
          {copiedMessage && <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">{copiedMessage}</div>}
        </div>
      </motion.div>
    </div>
  );
}