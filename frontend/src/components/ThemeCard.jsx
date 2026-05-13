import { useState } from 'react';
import ThemeDetailModal from './ThemeDetailModal';
import { getAllStoreLinks } from '../services/api';

export default function ThemeCard({ theme, platform }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyAllStoreLinks = async () => {
    const links = await getAllStoreLinks({ theme_id: theme.id });
    const urls = links.map(l => l.store_url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const imageUrl = theme.image && theme.image.startsWith('http') ? theme.image : (theme.image ? `https://tms.craffo.com/storage/${theme.image}` : 'https://placehold.co/600x400?text=No+Preview');
  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-light-mauve hover:border-purple group relative">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img src={imageUrl} alt={theme.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Preview'; }} />
          <div className="absolute top-2 right-2 bg-purple text-white text-xs px-2 py-1 rounded-full">{platform}</div>
          {theme.is_pinned === 1 && <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">📌 مثبت</div>}
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-dark-navy">{theme.name}</h3>
          <p className="text-mauve text-sm mt-1 line-clamp-2">{theme.description || 'وصف الثيم'}</p>
          {theme.price && theme.price !== '0' && <div className="text-purple font-bold mt-2">{theme.price} ر.س</div>}
          <div className="flex justify-between items-center mt-4">
            <span className="text-purple font-semibold">{theme.stores_count || 0} متجر يستخدمه</span>
            <button onClick={() => setShowModal(true)} className="bg-purplelight hover:bg-purple text-dark-navy hover:text-white px-4 py-1 rounded-full transition">تفاصيل</button>
          </div>
          <div className="flex gap-2 mt-3">
            {theme.demo_url && <a href={theme.demo_url} target="_blank" className="flex-1 text-center border border-purple text-purple rounded-lg py-1 hover:bg-purple hover:text-white transition">Demo</a>}
            {theme.purchase_url && <a href={theme.purchase_url} target="_blank" className="flex-1 text-center bg-purple text-white rounded-lg py-1 hover:bg-dark-navy transition">شراء</a>}
            <button onClick={copyAllStoreLinks} className="flex-1 text-center border border-gray-300 text-gray-600 rounded-lg py-1 hover:bg-gray-100 transition">📋 نسخ الروابط</button>
          </div>
          {copied && <div className="text-green-600 text-xs mt-2 text-center">✅ تم نسخ روابط جميع المتاجر</div>}
        </div>
      </div>
      {showModal && <ThemeDetailModal themeId={theme.id} onClose={() => setShowModal(false)} />}
    </>
  );
}