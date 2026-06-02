import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PaginatedResponse } from '../types'
import client from '../api/client'

interface MyFillword {
  id: number
  title: string
  topic: string
  status: string
  difficulty: string
  rejectionReason: string | null
  totalWordsCount: number
  createdAt: string
}

export default function Profile() {
  const [fillwords, setFillwords] = useState<MyFillword[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/fillwords/my', { params: { page, size: 20 } })
      .then(({ data }: { data: PaginatedResponse<MyFillword> }) => {
        setFillwords(data.content)
        setTotalPages(data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Мои филворды</h1>
        <Link to="/create" className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> Создать
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      ) : fillwords.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">У вас пока нет филвордов</p>
          <Link to="/create" className="text-indigo-600 font-semibold hover:underline">Создать первый</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Название</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden sm:table-cell">Тема</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Статус</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden md:table-cell">Дата</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {fillwords.map((fw) => (
                <tr key={fw.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{fw.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{fw.topic}</td>
                  <td className="px-6 py-4"><StatusBadge status={fw.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{new Date(fw.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4">
                    {fw.status === 'published' && (
                      <Link to={`/fillword/${fw.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Смотреть
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}