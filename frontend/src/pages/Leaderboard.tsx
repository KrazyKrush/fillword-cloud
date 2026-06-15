import { useState, useEffect } from 'react'
import { Trophy, Medal, Clock, Users, Calendar, Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

interface SolverEntry {
  rank: number
  username: string
  count: number
  userId?: number
}

interface SpeedEntry {
  rank: number
  username: string
  timeSeconds: number
  fillwordTitle: string
  errorsCount: number
  userId?: number
}

const TOP_VISIBLE = 10

export default function Leaderboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'solved' | 'speed'>('solved')
  const [period, setPeriod] = useState<'all' | 'week' | 'day'>('all')
  const [speedDiff, setSpeedDiff] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [topSolvers, setTopSolvers] = useState<SolverEntry[]>([])
  const [topSpeed, setTopSpeed] = useState<SpeedEntry[]>([])
  const [mySolver, setMySolver] = useState<SolverEntry | null>(null)
  const [mySpeed, setMySpeed] = useState<SpeedEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tab === 'solved') fetchTopSolvers()
    else fetchTopSpeed()
  }, [tab, period, speedDiff])

  const fetchTopSolvers = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/stats/top-solvers', {
        params: { period, limit: 50 }
      })
      const list: SolverEntry[] = data.leaderboard || []
      setTopSolvers(list.slice(0, TOP_VISIBLE))
      if (user) {
        const me = list.find((e: SolverEntry) => e.userId === user.id)
        setMySolver(me || null)
      }
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopSpeed = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/stats/top-speed', {
        params: { difficulty: speedDiff, limit: 50 }
      })
      const list: SpeedEntry[] = data.leaderboard || []
      setTopSpeed(list.slice(0, TOP_VISIBLE))
      if (user) {
        const me = list.find((e: SpeedEntry) => e.userId === user.id)
        setMySpeed(me || null)
      }
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Цвета для топ-3
  const getRowStyle = (rank: number, isMe: boolean): string => {
    if (isMe) return 'bg-indigo-50 border-l-4 border-indigo-500'
    if (rank === 1) return 'bg-yellow-50 border-l-4 border-yellow-400'
    if (rank === 2) return 'bg-slate-100 border-l-4 border-slate-300'
    if (rank === 3) return 'bg-amber-50 border-l-4 border-amber-400'
    return ''
  }

  // Иконка для топ-3
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-400">{rank}</span>
  }

  // Проверка, показывать ли разделитель и свою позицию
  const showGap = (list: any[], myEntry: any | null): boolean => {
    if (!myEntry) return false
    return myEntry.rank > TOP_VISIBLE
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl font-extrabold text-slate-800">Таблица лидеров</h1>
        <p className="text-slate-500 mt-1">Лучшие из лучших</p>
      </div>

      {/* Табы */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setTab('solved')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'solved' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Users className="w-4 h-4 inline mr-1" /> По количеству
        </button>
        <button
          onClick={() => setTab('speed')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'speed' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Zap className="w-4 h-4 inline mr-1" /> По скорости
        </button>
      </div>

      {/* Под-табы для количества */}
      {tab === 'solved' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { key: 'all', label: 'Всё время', icon: Calendar },
            { key: 'week', label: 'Неделя', icon: Clock },
            { key: 'day', label: 'День', icon: Zap },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as any)}
              className={`px-4 py-2 rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 ${period === p.key ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <p.icon className="w-3.5 h-3.5" />
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Под-табы для скорости */}
      {tab === 'speed' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { key: 'easy', label: 'Лёгкий', activeClass: 'bg-emerald-100 text-emerald-700' },
            { key: 'medium', label: 'Средний', activeClass: 'bg-amber-100 text-amber-700' },
            { key: 'hard', label: 'Сложный', activeClass: 'bg-red-100 text-red-700' },
          ].map(d => (
            <button
              key={d.key}
              onClick={() => setSpeedDiff(d.key as any)}
              className={`px-4 py-2 rounded-xl font-medium text-xs transition-all ${speedDiff === d.key ? d.activeClass + ' shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Таблица */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Заголовок таблицы */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2 text-center">Место</div>
            <div className="col-span-6">Игрок</div>
            {tab === 'solved' ? (
              <div className="col-span-4 text-right">Решено</div>
            ) : (
              <div className="col-span-4 text-right">Время</div>
            )}
          </div>

          {/* Строки таблицы */}
          {tab === 'solved' && topSolvers.map((entry) => {
            const isMe = user?.id === entry.userId
            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-50 transition-colors ${getRowStyle(entry.rank, isMe)}`}
              >
                <div className="col-span-2 flex items-center justify-center">{getRankBadge(entry.rank)}</div>
                <div className="col-span-6 flex items-center font-semibold text-slate-800">
                  {entry.username}
                  {isMe && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Вы</span>}
                </div>
                <div className="col-span-4 flex items-center justify-end font-mono text-sm font-bold text-indigo-600">
                  {entry.count} филвордов
                </div>
              </div>
            )
          })}

          {tab === 'speed' && topSpeed.map((entry) => {
            const isMe = user?.id === entry.userId
            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-50 transition-colors ${getRowStyle(entry.rank, isMe)}`}
              >
                <div className="col-span-2 flex items-center justify-center">{getRankBadge(entry.rank)}</div>
                <div className="col-span-6 flex items-center">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {entry.username}
                      {isMe && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Вы</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{entry.fillwordTitle}</div>
                  </div>
                </div>
                <div className="col-span-4 flex items-center justify-end text-right">
                  <div>
                    <div className="font-mono text-sm font-bold text-indigo-600">{formatTime(entry.timeSeconds)}</div>
                    <div className="text-xs text-slate-400">{entry.errorsCount} ошиб.</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Разделитель (многоточие) */}
          {tab === 'solved' && showGap(topSolvers, mySolver) && (
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="col-span-2 flex items-center justify-center">
                <span className="text-slate-400 font-bold tracking-widest">···</span>
              </div>
              <div className="col-span-10 flex items-center">
                <ChevronRight className="w-4 h-4 text-slate-300 mr-2" />
                <span className="text-xs text-slate-400">Ваша позиция ниже</span>
              </div>
            </div>
          )}

          {tab === 'speed' && showGap(topSpeed, mySpeed) && (
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="col-span-2 flex items-center justify-center">
                <span className="text-slate-400 font-bold tracking-widest">···</span>
              </div>
              <div className="col-span-10 flex items-center">
                <ChevronRight className="w-4 h-4 text-slate-300 mr-2" />
                <span className="text-xs text-slate-400">Ваша позиция ниже</span>
              </div>
            </div>
          )}

          {/* Своя позиция (если не в топ-10) */}
          {tab === 'solved' && mySolver && mySolver.rank > TOP_VISIBLE && (
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-indigo-50 border-l-4 border-indigo-500">
              <div className="col-span-2 flex items-center justify-center">
                <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-indigo-600">{mySolver.rank}</span>
              </div>
              <div className="col-span-6 flex items-center font-semibold text-slate-800">
                {mySolver.username}
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Вы</span>
              </div>
              <div className="col-span-4 flex items-center justify-end font-mono text-sm font-bold text-indigo-600">
                {mySolver.count} филвордов
              </div>
            </div>
          )}

          {tab === 'speed' && mySpeed && mySpeed.rank > TOP_VISIBLE && (
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-indigo-50 border-l-4 border-indigo-500">
              <div className="col-span-2 flex items-center justify-center">
                <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-indigo-600">{mySpeed.rank}</span>
              </div>
              <div className="col-span-6 flex items-center">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    {mySpeed.username}
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Вы</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{mySpeed.fillwordTitle}</div>
                </div>
              </div>
              <div className="col-span-4 flex items-center justify-end text-right">
                <div>
                  <div className="font-mono text-sm font-bold text-indigo-600">{formatTime(mySpeed.timeSeconds)}</div>
                  <div className="text-xs text-slate-400">{mySpeed.errorsCount} ошиб.</div>
                </div>
              </div>
            </div>
          )}

          {/* Нет данных */}
          {tab === 'solved' && topSolvers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Пока никто не решал филворды</p>
            </div>
          )}
          {tab === 'speed' && topSpeed.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Нет данных для этого уровня сложности</p>
            </div>
          )}
        </div>
      )}

      {/* Не авторизован */}
      {!user && (
        <p className="text-center text-xs text-slate-400 mt-4">
          Войдите в аккаунт, чтобы увидеть свою позицию в рейтинге
        </p>
      )}
    </div>
  )
}