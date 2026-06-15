import { useState, useEffect } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import ModerationModal from '../components/ModerationModal'
import Pagination from '../components/Pagination'
import { ModerationQueueItem, ModerationQueueResponse, FillwordCard, PaginatedResponse } from '../types'
import client from '../api/client'

export default function Moderation() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([])
  const [published, setPublished] = useState<FillwordCard[]>([])
  const [page, setPage] = useState(1)
  const [pubPage, setPubPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pubTotalPages, setPubTotalPages] = useState(1)
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'queue' | 'published'>('queue')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteTitle, setDeleteTitle] = useState('')

  const fetchQueue = () => {
    setLoading(true)
    client.get('/moderation/queue', { params: { page, size: 20 } })
      .then(({ data }: { data: ModerationQueueResponse }) => {
        setQueue(data.content)
        setTotalPages(data.totalPages)
        setTotalInQueue(data.totalInQueue)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchPublished = () => {
    setLoading(true)
    client.get('/moderation/published', { params: { page: pubPage, size: 20 } })
      .then(({ data }: { data: PaginatedResponse<FillwordCard> }) => {
        setPublished(data.content)
        setPubTotalPages(data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'queue') fetchQueue()
    else fetchPublished()
  }, [page, pubPage, tab])

  const handleDelete = async () => {
    if (!deleteId || !deleteReason.trim()) return
    try {
      await client.put(`/moderation/published/${deleteId}/delete`, { reason: deleteReason })
      setDeleteId(null)
      setDeleteReason('')
      setDeleteTitle('')
      fetchPublished()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка удаления')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Модерация</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('queue')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'queue' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            На модерации ({totalInQueue})
          </button>
          <button
            onClick={() => setTab('published')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'published' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Каталог
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      ) : (
        <>
          {tab === 'queue' && (
            <>
              {queue.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Очередь пуста</div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Название</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden sm:table-cell">Автор</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden md:table-cell">Тема</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{item.creatorUsername}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{item.topic}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedId(item.id)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1">
                              <Eye className="w-4 h-4" /> Смотреть
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}

          {tab === 'published' && (
            <>
              {published.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Нет опубликованных филвордов</div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Название</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden sm:table-cell">Автор</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden md:table-cell">Тема</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Просмотры</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {published.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{item.creatorUsername}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{item.topic}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{item.viewsCount}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => { setDeleteId(item.id); setDeleteTitle(item.title) }}
                              className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={pubPage} totalPages={pubTotalPages} onPage={setPubPage} />
            </>
          )}
        </>
      )}

      {selectedId && (
        <ModerationModal
          fillwordId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={fetchQueue}
        />
      )}

      {/* Модальное окно удаления */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteId(null); setDeleteReason('') }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Удалить филворд из каталога</h2>
            <p className="text-slate-500 text-sm mb-1">
              <strong>{deleteTitle}</strong>
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Филворд будет скрыт из каталога. Автор увидит причину удаления.
            </p>
            <textarea
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-50 focus:outline-none resize-none text-sm"
              rows={3}
              placeholder="Причина удаления (обязательно)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setDeleteId(null); setDeleteReason('') }}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}