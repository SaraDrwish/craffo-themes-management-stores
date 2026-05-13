import { useState, useEffect } from 'react';
import { getAllThemes, createTheme, updateTheme, deleteTheme, resetThemeApi, reorderTheme,
         getAllStoreLinks, createStoreLink, updateStoreLink, deleteStoreLink,
         getAdminStats, syncNow } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('themes');
  const [themes, setThemes] = useState([]);
  const [storeLinks, setStoreLinks] = useState([]);
  const [stats, setStats] = useState({ themes: 0, stores: 0 });
  const [editingTheme, setEditingTheme] = useState(null);
  const [editingStoreLink, setEditingStoreLink] = useState(null);
  const [formData, setFormData] = useState({
    theme_id: '',
    store_name: '',
    store_url: '',
    platform: 'Salla',
    plan: 'none'
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStats();
    if (activeTab === 'themes') fetchThemes();
    if (activeTab === 'stores') fetchStoreLinks();
  }, [activeTab, token]);

  async function fetchStats() { const data = await getAdminStats(token); setStats(data); }
  async function fetchThemes() { const data = await getAllThemes(); setThemes(data); }
  async function fetchStoreLinks() { const data = await getAllStoreLinks(); setStoreLinks(data); }

  const handleSync = async () => { await syncNow(token); await fetchThemes(); await fetchStats(); alert('تمت المزامنة'); };

  const handleThemeSave = async () => {
    try {
      if (editingTheme) await updateTheme(editingTheme.id, formData, token);
      else await createTheme(formData, token);
      resetForm(); fetchThemes(); fetchStats();
    } catch (err) { setErrorMsg(err.response?.data?.error || 'حدث خطأ'); }
  };
  const handleThemeDelete = async (id) => { if (confirm('حذف الثيم؟')) { await deleteTheme(id, token); fetchThemes(); fetchStats(); } };
  const handleThemeReset = async (id) => { if (confirm('إعادة تعيين بيانات API؟')) { await resetThemeApi(id, token); fetchThemes(); } };
  const handleThemeReorder = async (id, direction) => { await reorderTheme(id, direction, token); fetchThemes(); };

  const handleStoreSave = async () => {
    if (!formData.theme_id || !formData.store_name || !formData.store_url || !formData.platform) {
      setErrorMsg('الرجاء ملء جميع الحقول');
      return;
    }
    // التحقق من صحة الرابط على الواجهة أيضاً
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(formData.store_url)) {
      setErrorMsg('الرابط غير صالح. يجب أن يبدأ بـ http:// أو https://');
      return;
    }
    const payload = new FormData();
    payload.append('theme_id', formData.theme_id);
    payload.append('store_name', formData.store_name);
    payload.append('store_url', formData.store_url);
    payload.append('platform', formData.platform);
    payload.append('plan', formData.plan);
    if (imageFile) payload.append('image', imageFile);
    try {
      if (editingStoreLink) await updateStoreLink(editingStoreLink.id, payload, token);
      else await createStoreLink(payload, token);
      resetForm(); fetchStoreLinks(); fetchStats();
      alert('تم إضافة المتجر بنجاح');
    } catch (err) {
      const msg = err.response?.data?.error || 'حدث خطأ';
      setErrorMsg(msg);
      alert(msg);
    }
  };
  const handleStoreDelete = async (id) => { if (confirm('حذف المتجر؟')) { await deleteStoreLink(id, token); fetchStoreLinks(); fetchStats(); } };

  const resetForm = () => {
    setEditingTheme(null); setEditingStoreLink(null);
    setFormData({ theme_id: '', store_name: '', store_url: '', platform: 'Salla', plan: 'none' });
    setImageFile(null); setPreviewUrl(null); setErrorMsg('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null); setPreviewUrl(null);
    }
  };

  const renderThemeForm = () => (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">{editingTheme ? 'تعديل ثيم' : 'إضافة ثيم جديد'}</h3>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="الاسم" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-1 rounded" />
        <select value={formData.platform || 'Salla'} onChange={e => setFormData({...formData, platform: e.target.value})} className="border p-1 rounded"><option value="Salla">سلة</option><option value="Zid">زد</option></select>
        <input placeholder="السعر" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} className="border p-1 rounded" />
        <select value={formData.plan || 'none'} onChange={e => setFormData({...formData, plan: e.target.value})} className="border p-1 rounded">
          <option value="none">بدون باقة</option>
          <option value="starter">🚀 باقة الانطلاق</option>
          <option value="growth">🌟 باقة النمو</option>
          <option value="gold">👑 الباقة الذهبية</option>
        </select>
        <input placeholder="رابط الصورة" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} className="border p-1 rounded" />
        <input placeholder="رابط Demo" value={formData.demo_url || ''} onChange={e => setFormData({...formData, demo_url: e.target.value})} className="border p-1 rounded" />
        <input placeholder="رابط الشراء" value={formData.purchase_url || ''} onChange={e => setFormData({...formData, purchase_url: e.target.value})} className="border p-1 rounded" />
        <textarea placeholder="الوصف" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="border p-1 rounded" />
        <label><input type="checkbox" checked={formData.is_pinned || false} onChange={e => setFormData({...formData, is_pinned: e.target.checked})} /> مثبت</label>
        <label><input type="checkbox" checked={formData.is_hidden || false} onChange={e => setFormData({...formData, is_hidden: e.target.checked})} /> مخفي</label>
      </div>
      {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
      <button onClick={handleThemeSave} className="mt-2 bg-green-500 text-white px-3 py-1 rounded">حفظ</button>
      {editingTheme && <button onClick={resetForm} className="mt-2 bg-gray-400 text-white px-3 py-1 rounded ml-2">إلغاء</button>}
    </div>
  );

  const renderStoreForm = () => (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">{editingStoreLink ? 'تعديل متجر' : 'إضافة متجر جديد'}</h3>
      <div className="space-y-3">
        <select value={formData.theme_id} onChange={e => setFormData({...formData, theme_id: parseInt(e.target.value)})} className="border p-2 rounded w-full">
          <option value="">-- اختر الثيم --</option>
          {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="text" placeholder="اسم المتجر *" value={formData.store_name} onChange={e => setFormData({...formData, store_name: e.target.value})} className="border p-2 rounded w-full" />
        <input type="url" placeholder="رابط المتجر * (http:// أو https://)" value={formData.store_url} onChange={e => setFormData({...formData, store_url: e.target.value})} className="border p-2 rounded w-full" />
        <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="border p-2 rounded w-full">
          <option value="Salla">سلة</option><option value="Zid">زد</option>
        </select>
        <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="border p-2 rounded w-full">
          <option value="none">بدون باقة</option>
          <option value="starter">🚀 باقة الانطلاق</option>
          <option value="growth">🌟 باقة النمو</option>
          <option value="gold">👑 الباقة الذهبية</option>
        </select>
        <div className="border p-2 rounded">
          <label className="block text-sm font-medium mb-1">صورة المتجر (اختياري)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
          {previewUrl && <img src={previewUrl} className="mt-2 w-24 h-24 object-cover rounded" alt="preview" />}
          {!previewUrl && editingStoreLink && editingStoreLink.image_url && <img src={editingStoreLink.image_url} className="mt-2 w-24 h-24 object-cover rounded" alt="current" />}
        </div>
        {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
        <button onClick={handleStoreSave} className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600">{editingStoreLink ? 'تحديث المتجر' : 'حفظ المتجر'}</button>
        {editingStoreLink && <button onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2">إلغاء التعديل</button>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-dark-navy text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">لوحة تحكم Craffo</h1>
        <div className="flex gap-2 items-center">
          <span>إحصائيات: {stats.themes} ثيم | {stats.stores} متجر</span>
          <button onClick={handleSync} className="bg-blue-500 px-3 py-1 rounded">مزامنة من API</button>
          <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">خروج</button>
        </div>
      </div>
      <div className="flex border-b bg-white">
        <button onClick={() => setActiveTab('themes')} className={`px-6 py-3 ${activeTab === 'themes' ? 'border-b-2 border-purple text-purple font-bold' : ''}`}>الثيمات</button>
        <button onClick={() => setActiveTab('stores')} className={`px-6 py-3 ${activeTab === 'stores' ? 'border-b-2 border-purple text-purple font-bold' : ''}`}>المتاجر</button>
      </div>
      <div className="p-4">
        {activeTab === 'themes' && (
          <>
            {renderThemeForm()}
            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr><th className="p-2">الاسم</th><th>المنصة</th><th>الباقة</th><th>المتاجر</th><th></th></tr>
                </thead>
                <tbody>
                  {themes.map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-2">{t.name}</td>
                      <td>{t.platform}</td>
                      <td>{t.plan === 'starter' ? '🚀 انطلاق' : t.plan === 'growth' ? '🌟 نمو' : t.plan === 'gold' ? '👑 ذهبية' : 'بدون باقة'}</td>
                      <td>{t.stores_count}</td>
                      <td className="flex gap-1">
                        <button onClick={() => { setEditingTheme(t); setFormData({ ...t, plan: t.plan || 'none' }); }} className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">تعديل</button>
                        <button onClick={() => handleThemeReset(t.id)} className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">Reset</button>
                        <button onClick={() => handleThemeDelete(t.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">حذف</button>
                        <button onClick={() => handleThemeReorder(t.id, 'up')} className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs">↑</button>
                        <button onClick={() => handleThemeReorder(t.id, 'down')} className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs">↓</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === 'stores' && (
          <>
            {renderStoreForm()}
            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr><th>اسم المتجر</th><th>الرابط</th><th>الثيم</th><th>المنصة</th><th>الباقة</th><th>الصورة</th><th></th></tr>
                </thead>
                <tbody>
                  {storeLinks.map(s => {
                    const themeName = themes.find(t => t.id === s.theme_id)?.name || 'غير معروف';
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{s.store_name}</td>
                        <td className="truncate max-w-xs">{s.store_url}</td>
                        <td>{themeName}</td>
                        <td>{s.platform}</td>
                        <td>{s.plan === 'starter' ? '🚀 انطلاق' : s.plan === 'growth' ? '🌟 نمو' : s.plan === 'gold' ? '👑 ذهبية' : 'بدون باقة'}</td>
                        <td>{s.image_url ? <img src={s.image_url} className="w-8 h-8 object-cover rounded" alt="store" /> : 'لا توجد'}</td>
                        <td className="flex gap-1">
                          <button onClick={() => { setEditingStoreLink(s); setFormData({ theme_id: s.theme_id, store_name: s.store_name, store_url: s.store_url, platform: s.platform, plan: s.plan || 'none' }); setPreviewUrl(null); }} className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">تعديل</button>
                          <button onClick={() => handleStoreDelete(s.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">حذف</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}