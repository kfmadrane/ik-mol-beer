import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      <aside className="w-64 bg-slate-800 text-white shadow-2xl flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-black tracking-tight">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-3">
          <Link href="/admin/words" className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium">
            Manage Words
          </Link>
          <Link href="/admin/letters" className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium">
            Manage Letters
          </Link>
          <div className="pt-8 mt-4 border-t border-slate-700">
            <Link href="/" className="block px-4 py-3 text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-center transition-colors shadow">
              Back to Game
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
