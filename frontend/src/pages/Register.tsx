import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    try {
      const { data } = await client.post('/auth/register', { username, password })
      login(
        { id: data.userId, username: data.username, role: data.role },
        data.accessToken
      )
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleVKLogin = () => {
    // Заглушка для VK OAuth
    alert('Авторизация через ВКонтакте будет доступна в ближайшем обновлении')
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Регистрация</h1>
          <p className="text-slate-500 text-sm mt-1">Создайте аккаунт, чтобы создавать филворды</p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Имя пользователя
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="Придумайте имя"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">От 3 до 20 символов</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Подтверждение пароля
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Введите пароль ещё раз"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-4 focus:outline-none transition-all text-sm ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                    : confirmPassword && password === confirmPassword
                    ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-50'
                    : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-emerald-500 mt-1">Пароли совпадают ✓</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            Зарегистрироваться
          </button>
        </form>

        {/* Разделитель */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">или</span>
          </div>
        </div>

        {/* VK */}
        <button
          onClick={handleVKLogin}
          className="w-full px-6 py-3 bg-[#0077FF] text-white rounded-xl font-semibold hover:bg-[#0066DD] hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.073 2H8.937C3.333 2 2 3.333 2 8.927v6.136C2 20.667 3.323 22 8.927 22h6.136C20.667 22 22 20.677 22 15.073V8.937C22 3.333 20.677 2 15.073 2zm3.073 14.27h-1.459c-.552 0-.718-.447-1.708-1.437-.864-.833-1.229-.937-1.448-.937-.302 0-.385.083-.385.5v1.312c0 .355-.115.563-1.042.563-1.395 0-3.021-.854-4.177-2.406C6.125 12.083 5 8.865 5 8.323c0-.26.083-.51.5-.51h1.448c.375 0 .51.167.656.562.708 2.063 1.916 3.865 2.406 3.865.188 0 .27-.083.27-.552V9.416c-.062-1-.584-1.083-.584-1.448 0-.167.135-.344.354-.344h2.292c.302 0 .417.156.417.49v2.635c0 .302.135.406.229.406.188 0 .333-.104.667-.448 1-1.156 1.708-2.938 1.708-2.938.083-.25.292-.49.656-.49h1.459c.448 0 .542.27.448.593-.177.833-1.896 3.25-1.896 3.25-.146.25-.208.364 0 .656.146.208.636.937 1.021 1.51.552.76 1.145 1.666 1.145 1.666.177.323.062.625-.427.625z"/>
          </svg>
          Войти через ВКонтакте
        </button>

        {/* Вход */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}