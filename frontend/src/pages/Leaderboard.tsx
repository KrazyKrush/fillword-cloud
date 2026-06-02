import { useState, useEffect } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { LeaderboardData } from '../types'
import client from '../api/client'

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Берём первый попавшийся ID для демонстрации, либо можно сделать выбор из списка
  useEffect(() => {
    client.get('/fillwords', { params: { page: 1, size: 1 } })
      .then(({ data: catalog }) => {
        if (catalog.content.length > 0) {
          return client.get(`/solve/leaderboard/${catalog.content[0].id}`)
        }
        throw new Error('No fillwords')
      })
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-slate-400">Загрузка...</div>
  if (!data) return <div className="text-center py-20 text-slate-400">Нет данных</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h1 className="text-3xl font-extrabold text-slate-800">Таблица лидеров</h1>
        <p className="text-slate-500 mt-1">{data.fillwordTitle} ({data.difficulty})</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-500 w-16">Место</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-500">Игрок</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-500">Время</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-500">Ошибок</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((entry) => (
              <tr key={entry.rank} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  {entry.rank === 1 ? <Medal className="w-6 h-6 text-yellow-500" /> :
                   entry.rank === 2 ? <Medal className="w-6 h-6 text-slate-300" /> :
                   entry.rank === 3 ? <Medal className="w-6 h-6 text-amber-600" /> :
                   <span className="text-slate-500 font-medium">{entry.rank}</span>}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800">{entry.username}</td>
                <td className="px-6 py-4 text-right font-mono text-sm">
                  {String(Math.floor(entry.timeSeconds / 60)).padStart(2, '0')}:{String(entry.timeSeconds % 60).padStart(2, '0')}
                </td>
                <td className="px-6 py-4 text-right text-sm text-slate-500">{entry.errorsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}