import { useState, useEffect } from 'react';
import { getAllThemes, createTheme, updateTheme, deleteTheme, resetThemeApi, reorderTheme,
         getAllCategories, createCategory, updateCategory, deleteCategory,
         getAllStoreLinks, createStoreLink, updateStoreLink, deleteStoreLink,
         getAdminStats, syncNow } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('themes');
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeLinks, setStoreLinks] = useState([]);
  const [stats, setStats] = useState({ themes: 0, stores: 0 });
  const [editingTheme, setEditingTheme] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingStoreLink, setEditingStoreLink] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStats();
    if (activeTab === 'themes') fetchThemes();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'stores') fetchStoreLinks();
  }, [activeTab, token]);

  async function fetchStats() { const data = await getAdminStats(token); setStats(data); }
  async function fetchThemes() { const data = await getAllThemes(); setThemes(data); }
  async function fetchCategories() { const data = await getAllCategories(); setCategories(data); }
  async function fetchStoreLinks() { const data = await getAllStoreLinks(); setStoreLinks(data); }

  const handleSync = async () => { await syncNow(token); await fetchThemes(); await fetchStats(); alert('تمت المزامنة'); };

  const handleThemeSave = async () => {
    try {
      if (editingTheme) await updateTheme(editingTheme.id, formData, token);
      else await createTheme(formData, token);
      resetForm(); fetchThemes(); fetchStats();
      setErrorMsg('');
    } catch (err) { setErrorMsg(err.response?.data?.error || 'حدث خطأ'); }
  };
  const handleThemeDelete = async (id) => { if (confirm('حذف؟')) { await deleteTheme(id, token); fetchThemes(); fetchStats(); } };
  const handleThemeReset = async (id) => { if (confirm('استعادة بيانات API؟')) { await resetThemeApi(id, token); fetchThemes(); } };
  const handleThemeReorder = async (id, direction) => { await reorderTheme(id, direction, token); fetchThemes(); };

  const handleCategorySave = async () => {
    try {
      if (editingCategory) await updateCategory(editingCategory.id, formData, token);
      else await createCategory(formData, token);
      resetForm(); fetchCategories();
      setErrorMsg('');
    } catch (err) { setErrorMsg(err.response?.data?.error || 'حدث خطأ'); }
  };
  const handleCategoryDelete = async (id) => { if (confirm('حذف؟')) { await deleteCategory(id, token); fetchCategories(); } };

  const handleStoreLinkSave = async () => {
    try {
      if (editingStoreLink) await updateStoreLink(editingStoreLink.id, formData, token);
      else await createStoreLink(formData, token);
      resetForm(); fetchStoreLinks();
      setErrorMsg('');
    } catch (err) {
      const msg = err.response?.data?.error || 'حدث خطأ';
      setErrorMsg(msg);
      alert(msg);
    }
  };
  const handleStoreLinkDelete = async (id) => { if (confirm('حذف؟')) { await deleteStoreLink(id, token); fetchStoreLinks(); } };

  const resetForm = () => {
    setEditingTheme(null); setEditingCategory(null); setEditingStoreLink(null);
    setFormData({}); setErrorMsg('');
  };

  const renderThemeForm = () => (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">{editingTheme ? 'تعديل ثيم' : 'إضافة ثيم'}</h3>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="الاسم" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-1 rounded" />
        <select value={formData.platform || 'Salla'} onChange={e => setFormData({...formData, platform: e.target.value})} className="border p-1 rounded"><option value="Salla">سلة</option><option value="Zid">زد</option></select>
        <input placeholder="السعر" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} className="border p-1 rounded" />
        <select value={formData.plan || 'starter'} onChange={e => setFormData({...formData, plan: e.target.value})} className="border p-1 rounded"><option value="starter">انطلاق</option><option value="growth">نمو</option><option value="gold">ذهبية</option></select>
        <input placeholder="رابط الصورة" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} className="border p-1 rounded" />
        <input placeholder="رابط Demo" value={formData.demo_url || ''} onChange={e => setFormData({...formData, demo_url: e.target.value})} className="border p-1 rounded" />
        <input placeholder="رابط الشراء" value={formData.purchase_url || ''} onChange={e => setFormData({...formData, purchase_url: e.target.value})} className="border p-1 rounded" />
        <textarea placeholder="الوصف" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="border p-1 rounded" />
        <label><input type="checkbox" checked={formData.is_pinned || false} onChange={e => setFormData({...formData, is_pinned: e.target.checked})} /> مثبت</label>
        <label><input type="checkbox" checked={formData.is_hidden || false} onChange={e => setFormData({...formData, is_hidden: e.target.checked})} /> مخفي</label>
      </div>
      {errorMsg && <div className="text-red-500 text-sm mt-2">{errorMsg}</div>}
      <button onClick={handleThemeSave} className="mt-2 bg-green-500 text-white px-3 py-1 rounded">حفظ</button>
      {editingTheme && <button onClick={resetForm} className="mt-2 bg-gray-400 text-white px-3 py-1 rounded ml-2">إلغاء</button>}
    </div>
  );

  const renderCategoryForm = () => (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">{editingCategory ? 'تعديل فئة' : 'إضافة فئة'}</h3>
      <select value={formData.theme_id || ''} onChange={e => setFormData({...formData, theme_id: parseInt(e.target.value)})} className="border p-1 rounded w-full mb-2">
        <option value="">اختر الثيم</option>
        {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input placeholder="اسم الفئة" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-1 rounded w-full mb-2" />
      <button onClick={handleCategorySave} className="bg-green-500 text-white px-3 py-1 rounded">حفظ</button>
      {editingCategory && <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded ml-2">إلغاء</button>}
    </div>
  );

  const renderStoreLinkForm = () => (
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">{editingStoreLink ? 'تعديل متجر' : 'إضافة متجر'}</h3>
      <select value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} className="border p-1 rounded w-full mb-2">
        <option value="">اختر الفئة</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input placeholder="اسم المتجر" value={formData.store_name || ''} onChange={e => setFormData({...formData, store_name: e.target.value})} className="border p-1 rounded w-full mb-2" />
      <input placeholder="رابط المتجر" value={formData.store_url || ''} onChange={e => setFormData({...formData, store_url: e.target.value})} className="border p-1 rounded w-full mb-2" />
      <select value={formData.platform || 'Salla'} onChange={e => setFormData({...formData, platform: e.target.value})} className="border p-1 rounded w-full mb-2">
        <option value="Salla">سلة</option><option value="Zid">زد</option>
      </select>
      {/* اختيار الباقة للمتجر */}
      <select value={formData.plan || 'starter'} onChange={e => setFormData({...formData, plan: e.target.value})} className="border p-1 rounded w-full mb-2">
        <option value="starter">🚀 باقة الانطلاق</option>
        <option value="growth">🌟 باقة النمو</option>
        <option value="gold">👑 الباقة الذهبية</option>
      </select>
      {errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
      <button onClick={handleStoreLinkSave} className="bg-green-500 text-white px-3 py-1 rounded">حفظ</button>
      {editingStoreLink && <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded ml-2">إلغاء</button>}
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
        {['themes', 'categories', 'stores'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 ${activeTab === tab ? 'border-b-2 border-purple text-purple font-bold' : ''}`}>
            {tab === 'themes' && 'الثيمات'} {tab === 'categories' && 'الفئات'} {tab === 'stores' && 'المتاجر'}
          </button>
        ))}
      </div>
      <div className="p-4">
        {activeTab === 'themes' && (
          <>
            {renderThemeForm()}
            <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-200"><tr><th>الاسم</th><th>المنصة</th><th>الباقة</th><th>المتاجر</th><th></th></tr></thead><tbody>{themes.map(t => (<tr key={t.id} className="border-b"><td className="p-2">{t.name}</td><td>{t.platform}</td><td>{t.plan}</td><td>{t.stores_count}</td><td className="flex gap-1"><button onClick={() => { setEditingTheme(t); setFormData(t); }} className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">تعديل</button><button onClick={() => handleThemeReset(t.id)} className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">Reset</button><button onClick={() => handleThemeDelete(t.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">حذف</button><button onClick={() => handleThemeReorder(t.id,'up')} className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs">↑</button><button onClick={() => handleThemeReorder(t.id,'down')} className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs">↓</button></td></tr>))}</tbody></table></div>
          </>
        )}
        {activeTab === 'categories' && (
          <>
            {renderCategoryForm()}
            <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-200"><tr><th>اسم الفئة</th><th>الثيم</th><th>عدد المتاجر</th><th></th></tr></thead><tbody>{categories.map(c => (<tr key={c.id} className="border-b"><td className="p-2">{c.name}</td><td>{themes.find(t => t.id === c.theme_id)?.name}</td><td>{c.stores_count}</td><td><button onClick={() => { setEditingCategory(c); setFormData({ theme_id: c.theme_id, name: c.name }); }} className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">تعديل</button><button onClick={() => handleCategoryDelete(c.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">حذف</button></td></tr>))}</tbody></table></div>
          </>
        )}
        {activeTab === 'stores' && (
          <>
            {renderStoreLinkForm()}
            <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-200"><tr><th>اسم المتجر</th><th>الرابط</th><th>الفئة</th><th>المنصة</th><th>الباقة</th><th></th></tr></thead><tbody>{storeLinks.map(s => (<tr key={s.id} className="border-b"><td className="p-2">{s.store_name}</td><td className="truncate max-w-xs">{s.store_url}</td><td>{s.category_name}</td><td>{s.platform}</td><td>{s.plan === 'starter' ? '🚀 انطلاق' : s.plan === 'growth' ? '🌟 نمو' : '👑 ذهبية'}</td><td><button onClick={() => { setEditingStoreLink(s); setFormData({ category_id: s.category_id, store_name: s.store_name, store_url: s.store_url, platform: s.platform, plan: s.plan }); }} className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">تعديل</button><button onClick={() => handleStoreLinkDelete(s.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">حذف</button></td></tr>))}</tbody></table></div>
          </>
        )}
      </div>
    </div>
  );
}