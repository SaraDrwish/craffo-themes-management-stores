export default function Filters({ search, setSearch }) {
  return (
    <div className="flex justify-center mt-4">
      <input
        type="text"
        placeholder="ابحث باسم الثيم أو المتجر..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-purplelight rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple transition"
      />
    </div>
  );
}