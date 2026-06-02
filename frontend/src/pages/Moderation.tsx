import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import ModerationModal from '../components/ModerationModal'
import Pagination from '../components/Pagination'
import { ModerationQueueItem, ModerationQueueResponse } from '../types'
import client from '../api/client'

export default function Moderation() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => { fetchQueue() }, [page])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Модерация</h1>
        <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-semibold text-sm">
          В очереди: {totalInQueue}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Очередь пуста</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Название</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden sm:table-cell">Автор</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden md:table-cell">Тема</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden lg:table-cell">Дата</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{item.creatorUsername}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{item.topic}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</td>
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

      {selectedId && (
        <ModerationModal
          fillwordId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={fetchQueue}
        />
      )}
    </div>
  )
}