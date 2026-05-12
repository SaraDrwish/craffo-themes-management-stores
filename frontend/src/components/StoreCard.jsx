const planLabels = {
  starter: '🚀 باقة الانطلاق',
  growth: '🌟 باقة النمو',
  gold: '👑 الباقة الذهبية'
};
const planColors = {
  starter: 'bg-green-500',
  growth: 'bg-blue-600',
  gold: 'bg-yellow-600'
};

export default function StoreCard({ store }) {
  const copyUrl = () => {
    navigator.clipboard.writeText(store.store_url);
    alert('تم نسخ الرابط');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-light-mauve hover:border-purple group relative">
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img src="https://placehold.co/600x400?text=Store+Preview" alt={store.store_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {/* شارة الباقة تظهر فقط إذا كان store.plan له قيمة */}
        {store.plan && store.plan !== 'none' && (
          <div className={`absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded-full font-bold ${planColors[store.plan]}`}>
            {planLabels[store.plan]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-dark-navy">{store.store_name}</h3>
        <p className="text-mauve text-sm mt-1">الثيم: {store.theme_name || 'غير معروف'}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-purple font-semibold">{store.platform}</span>
          <div className="flex gap-2">
            <a href={store.store_url} target="_blank" rel="noopener noreferrer" className="bg-purple text-white px-3 py-1 rounded-full text-sm hover:bg-dark-navy transition">زيارة المتجر</a>
            <button onClick={copyUrl} className="border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition">📋 نسخ</button>
          </div>
        </div>
      </div>
    </div>
  );
}