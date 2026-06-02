import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Grid3X3, LogIn, LogOut, FolderOpen, Shield, Menu, X, User } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const active = (p: string) => loc.pathname === p ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:block">FillWord Cloud</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className={`px-4 py-2 rounded-xl font-medium transition-all ${active('/')}`}>Каталог</Link>
          {isAuthenticated && (
            <>
              <Link to="/create" className={`px-4 py-2 rounded-xl font-medium transition-all ${active('/create')}`}>Создать</Link>
              <Link to="/profile" className={`px-4 py-2 rounded-xl font-medium transition-all ${active('/profile')}`}>Мои филворды</Link>
            </>
          )}
          <Link to="/leaderboard" className={`px-4 py-2 rounded-xl font-medium transition-all ${active('/leaderboard')}`}>Лидеры</Link>
          {isAdmin && (
            <Link to="/moderation" className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1 ${active('/moderation') ? 'bg-red-50 text-red-600' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}>
              <Shield className="w-4 h-4" /> Модерация
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{user?.username}</div>
                  <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
                </div>
              </div>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" title="Выйти"><LogOut className="w-5 h-5" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-xl font-medium border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 flex items-center gap-2"><LogIn className="w-4 h-4" /> Войти</Link>
              <Link to="/register" className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center gap-2"><User className="w-4 h-4" /> Регистрация</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-2">
          <Link to="/" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">Каталог</Link>
          {isAuthenticated && (
            <>
              <Link to="/create" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">Создать</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">Мои филворды</Link>
            </>
          )}
          <Link to="/leaderboard" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">Лидеры</Link>
          {isAdmin && (
            <Link to="/moderation" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50">Модерация</Link>
          )}
          <hr className="border-slate-100" />
          {isAuthenticated ? (
            <button onClick={() => { logout(); setOpen(false) }} className="w-full px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 text-left">Выйти</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-indigo-50">Войти</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-center">Регистрация</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}