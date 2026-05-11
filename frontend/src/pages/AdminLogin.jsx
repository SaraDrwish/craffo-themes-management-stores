import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminLogin(username, password);
      login(res.token, res.username);
      navigate('/admin-dashboard');
    } catch (err) {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy to-purple">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-dark-navy">تسجيل دخول الأدمن</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-4" required />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-4" required />
          <button type="submit" className="w-full bg-purple text-white py-2 rounded hover:bg-dark-navy transition">دخول</button>
        </form>
      </div>
    </div>
  );
}