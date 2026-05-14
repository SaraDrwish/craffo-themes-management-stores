import { useState, useEffect } from 'react';
import { getThemeById } from '../services/api';

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

export default function StoreCard({ store }) {
  const [themeImage, setThemeImage] = useState(null);
  const copyUrl = () => { navigator.clipboard.writeText(store.store_url); alert('تم نسخ الرابط'); };

  useEffect(() => {
    if (!store.image_url && store.theme_id) {
      getThemeById(store.theme_id).then(theme => {
        if (theme && theme.image) {
          const imgUrl = theme.image.startsWith('http') ? theme.image : `https://tms.craffo.com/storage/${theme.image}`;
          setThemeImage(imgUrl);
        }
      }).catch(() => {});
    }
  }, [store.theme_id, store.image_url]);

  const imageUrl = store.image_url || themeImage || 'https://placehold.co/600x400?text=Store+Preview';

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-light-mauve hover:border-purple group relative">
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={store.store_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Store+Preview'; }}
        />
        {/* شارة الباقة تظهر فقط إذا كان للمتجر باقة محددة */}
        {store.plan && store.plan !== 'none' && (
          <div className={`absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded-full font-bold ${planColors[store.plan]}`}>
            {planLabels[store.plan]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-dark-navy">{store.store_name}</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-mauve text-sm">الثيم: {store.theme_name || 'غير معروف'}</p>
          <span className="bg-purplelight text-dark-navy text-xs px-2 py-0.5 rounded-full">
            {store.platform === 'Salla' ? ' سلة' : ' زد'}
          </span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <a href={store.store_url} target="_blank" className="bg-purple text-white px-3 py-1 rounded-full text-sm hover:bg-dark-navy transition">زيارة المتجر</a>
            <button onClick={copyUrl} className="border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition">  نسخ</button>
          </div>
        </div>
      </div>
    </div>
  );
}