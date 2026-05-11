import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-dark-navy text-white py-4 px-6 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="https://craffo.com/wp-content/uploads/2025/10/CR-EN-WHITE.png" alt="Craffo" className="h-10" />
          <Link to="/" className="hover:text-purplelight transition">الرئيسية</Link>
          <Link to="/stores" className="hover:text-purplelight transition">جميع المتاجر</Link>
        </div>
        <h1 className="text-xl font-bold">Craffo Themes</h1>
      </div>
    </nav>
  );
}