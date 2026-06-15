import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import client from '../api/client'

interface MyFillword {
  id: number
  title: string
  topic: string
  status: string
  difficulty: string
  rejectionReason: string | null
  deletedReason: string | null
  totalWordsCount: number
  createdAt: string
}

export default function Profile() {
  const navigate = useNavigate()
  const [fillwords, setFillwords] = useState<MyFillword[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedReason, setExpandedReason] = useState<number | null>(null)

  const fetchFillwords = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError('')

    client.get('/fillwords/my', { params: { page, size: 20 } })
      .then((response: any) => {
        const data = response.data
        if (data && data.content) {
          setFillwords(data.content)
          setTotalPages(data.totalPages || 1)
        } else {
          setFillwords([])
          setTotalPages(1)
        }
      })
      .catch((err: any) => {
        console.error('Profile error:', err)
        if (err.response?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setError(err.response?.data?.error || 'Не удалось загрузить филворды')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFillwords()
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот филворд?')) return
    try {
      await client.delete(`/fillwords/${id}`)
      fetchFillwords()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка удаления')
    }
  }

  const formatDate = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString('ru-RU') }
    catch { return dateString }
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 ml-3">Загрузка...</p>
      </div>
    )
  }

  // Показываем ошибку
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchFillwords} className="text-indigo-600 font-semibold hover:underline">
          Попробовать снова
        </button>
      </div>
    )
  }

  // Основной контент
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Мои филворды</h1>
        <Link to="/create" className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> Создать
        </Link>
      </div>

      {fillwords.length === 0 ? (
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
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {fillwords.map((fw) => (
                <React.Fragment key={fw.id}>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{fw.title}</div>
                      {fw.rejectionReason && (
                        <button
                          onClick={() => setExpandedReason(expandedReason === fw.id ? null : fw.id)}
                          className="text-xs text-red-500 mt-1 flex items-center gap-1 hover:underline"
                        >
                          Причина {expandedReason === fw.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                      {fw.deletedReason && (
                        <div className="text-xs text-orange-500 mt-0.5">Удалён админом: {fw.deletedReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{fw.topic}</td>
                    <td className="px-6 py-4"><StatusBadge status={fw.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{formatDate(fw.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/fillword/${fw.id}`} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50" title="Смотреть">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/fillword/${fw.id}/edit`} className="text-amber-600 hover:text-amber-800 p-2 rounded-lg hover:bg-amber-50" title="Редактировать">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(fw.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50" title="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedReason === fw.id && fw.rejectionReason && (
                    <tr className="bg-red-50">
                      <td colSpan={5} className="px-6 py-3 text-sm text-red-700">
                        <strong>Причина отклонения:</strong> {fw.rejectionReason}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}