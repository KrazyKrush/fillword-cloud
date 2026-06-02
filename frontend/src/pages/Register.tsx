import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/auth/register', { username, password })
      login({ id: data.userId, username: data.username, role: data.role }, data.accessToken)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-extrabold text-slate-800 text-center mb-6">Регистрация</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Имя пользователя</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Зарегистрироваться
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Уже есть аккаунт? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  )
}