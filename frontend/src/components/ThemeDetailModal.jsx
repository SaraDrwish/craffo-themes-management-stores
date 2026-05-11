import { useState, useEffect } from 'react';
import { getThemeById } from '../services/api';
import { motion } from 'framer-motion';

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
    setCopiedMessage('✅ تم نسخ جميع الروابط!');
    setTimeout(() => setCopiedMessage(''), 2000);
  };

  const copyCategoryLinks = (stores) => {
    const urls = stores.map(s => s.store_url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopiedMessage('✅ تم نسخ روابط الفئة!');
    setTimeout(() => setCopiedMessage(''), 2000);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl">جاري التحميل...</div>
    </div>
  );
  if (!theme) return null;

  const allStores = theme.categories?.flatMap(cat => cat.stores || []) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-navy">{theme.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          <img 
            src={theme.image && theme.image.startsWith('http') ? theme.image : `https://tms.craffo.com/storage/${theme.image}`} 
            alt={theme.name} 
            className="w-full h-64 object-cover rounded-lg mb-4"
            onError={(e) => e.target.src = 'https://placehold.co/600x400'}
          />
          <p className="text-gray-600 mb-4">{theme.description}</p>
          {theme.plan && (
            <div className={`inline-block px-3 py-1 rounded-full text-white text-sm mb-4 ${theme.plan === 'starter' ? 'bg-green-500' : theme.plan === 'growth' ? 'bg-blue-600' : 'bg-yellow-600'}`}>
              {theme.plan === 'starter' ? '🚀 باقة الانطلاق' : theme.plan === 'growth' ? '🌟 باقة النمو' : '👑 الباقة الذهبية'}
            </div>
          )}
          <div className="mb-4 flex gap-4">
            {theme.demo_url && <a href={theme.demo_url} target="_blank" className="bg-purple text-white px-4 py-2 rounded-lg">عرض Demo</a>}
            {theme.purchase_url && <a href={theme.purchase_url} target="_blank" className="bg-dark-navy text-white px-4 py-2 rounded-lg">شراء الثيم</a>}
          </div>
          <h3 className="text-xl font-bold mt-6 mb-4">المتاجر المستخدمة</h3>
          {theme.categories?.map(cat => {
            if (!cat.stores || cat.stores.length === 0) return null;
            return (
              <div key={cat.id} className="mb-6 border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <h4 className="text-lg font-semibold text-purple">{cat.name}</h4>
                  <button onClick={() => copyCategoryLinks(cat.stores)} className="text-sm bg-gray-200 px-3 py-1 rounded-full hover:bg-purplelight">📋 نسخ روابط الفئة</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cat.stores.map(store => (
                    <div key={store.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="truncate">{store.store_name}</span>
                      <div className="flex gap-2">
                        <a href={store.store_url} target="_blank" className="text-blue-500 text-sm">فتح</a>
                        <button onClick={() => { navigator.clipboard.writeText(store.store_url); setCopiedMessage('✅ تم نسخ الرابط'); setTimeout(() => setCopiedMessage(''), 1500); }} className="text-gray-500 text-sm">📋</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {allStores.length > 0 && (
            <button onClick={() => copyAllLinks(allStores)} className="mt-4 bg-purple text-white px-4 py-2 rounded-lg w-full hover:bg-dark-navy transition">📋 نسخ كل روابط الثيم ({allStores.length} متجر)</button>
          )}
          {copiedMessage && <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">{copiedMessage}</div>}
        </div>
      </motion.div>
    </div>
  );
}