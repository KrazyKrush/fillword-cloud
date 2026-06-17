import { useState, useEffect } from 'react'
import { Eye, Trash2, Shield, Ban, CheckCircle, Clock } from 'lucide-react'
import ModerationModal from '../components/ModerationModal'
import Pagination from '../components/Pagination'
import client from '../api/client'

interface ModerationQueueItem {
  id: number
  title: string
  topic: string
  difficulty: string
  creatorUsername: string
  totalWordsCount: number
  createdAt: string
}

interface ModerationQueueResponse {
  content: ModerationQueueItem[]
  totalInQueue: number
  totalPages: number
  currentPage: number
}

interface FillwordCard {
  id: number
  title: string
  topic: string
  difficulty: string
  creatorUsername: string
  viewsCount: number
  createdAt: string
}

interface UserItem {
  id: number
  username: string
  role: string
  isActive: boolean
  blockReason: string | null
  muteUntil: string | null
  muteReason: string | null
  lockedUntil: string | null
  totalCreated: number
  totalSolved: number
}

interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  currentPage: number
}

export default function Moderation() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([])
  const [published, setPublished] = useState<FillwordCard[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [pubPage, setPubPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pubTotalPages, setPubTotalPages] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'queue' | 'published' | 'users'>('queue')

  // Удаление филворда
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteTitle, setDeleteTitle] = useState('')

  // Блокировка
  const [blockUserId, setBlockUserId] = useState<number | null>(null)
  const [blockUsername, setBlockUsername] = useState('')
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block')
  const [blockReason, setBlockReason] = useState('')

  // Мут
  const [muteUserId, setMuteUserId] = useState<number | null>(null)
  const [muteUsername, setMuteUsername] = useState('')
  const [muteMinutes, setMuteMinutes] = useState(60)
  const [muteReason, setMuteReason] = useState('')

  const fetchQueue = () => {
    setLoading(true)
    client.get('/moderation/queue', { params: { page, size: 20 } })
      .then((res: any) => {
        const data: ModerationQueueResponse = res.data
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
      .then((res: any) => {
        const data: PaginatedResponse<FillwordCard> = res.data
        setPublished(data.content)
        setPubTotalPages(data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchUsers = () => {
    setLoading(true)
    client.get('/auth/users', { params: { page: userPage, size: 20 } })
      .then((res: any) => {
        const data: PaginatedResponse<UserItem> = res.data
        setUsers(data.content)
        setUserTotalPages(data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'queue') fetchQueue()
    else if (tab === 'published') fetchPublished()
    else fetchUsers()
  }, [page, pubPage, userPage, tab])

  const handleDelete = async () => {
    if (!deleteId || !deleteReason.trim()) return
    try {
      await client.put(`/moderation/published/${deleteId}/delete`, { reason: deleteReason.trim() })
      setDeleteId(null)
      setDeleteReason('')
      setDeleteTitle('')
      fetchPublished()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const handleBlockClick = (userId: number, username: string, currentStatus: boolean) => {
    setBlockUserId(userId)
    setBlockUsername(username)
    setBlockAction(currentStatus ? 'block' : 'unblock')
    setBlockReason('')
  }

  const confirmBlock = async () => {
    if (!blockUserId) return
    if (blockAction === 'block' && !blockReason.trim()) {
      alert('Укажите причину блокировки')
      return
    }
    try {
      await client.put(`/auth/users/${blockUserId}/block`, {
        isActive: blockAction === 'unblock',
        reason: blockReason.trim() || undefined,
      })
      setBlockUserId(null)
      fetchUsers()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const handleMuteClick = (userId: number, username: string) => {
    setMuteUserId(userId)
    setMuteUsername(username)
    setMuteMinutes(60)
    setMuteReason('')
  }

  const confirmMute = async () => {
    if (!muteUserId || !muteReason.trim()) {
      alert('Укажите причину')
      return
    }
    try {
      await client.put(`/auth/users/${muteUserId}/mute`, {
        minutes: muteMinutes,
        reason: muteReason.trim(),
      })
      setMuteUserId(null)
      fetchUsers()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const handleUnmute = async (userId: number) => {
    try {
      await client.put(`/auth/users/${userId}/unmute`)
      fetchUsers()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleString('ru-RU')
    } catch {
      return dateString
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Модерация</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('queue')} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'queue' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            На модерации ({totalInQueue})
          </button>
          <button onClick={() => setTab('published')} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'published' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Каталог
          </button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${tab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Shield className="w-4 h-4" /> Пользователи
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      ) : (
        <>
          {/* Очередь модерации */}
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

          {/* Каталог */}
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
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {published.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{item.creatorUsername}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{item.topic}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => { setDeleteId(item.id); setDeleteTitle(item.title) }} className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1">
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

          {/* Пользователи */}
          {tab === 'users' && (
            <>
              {users.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Нет пользователей</div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Пользователь</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Роль</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden sm:table-cell">Статус</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 hidden md:table-cell">Создано</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${!u.isActive ? 'bg-red-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{u.username}</div>
                            {!u.isActive && u.blockReason && (
                              <div className="text-xs text-red-500 mt-0.5">Бан: {u.blockReason}</div>
                            )}
                            {u.muteUntil && new Date(u.muteUntil) > new Date() && (
                              <div className="text-xs text-amber-600 mt-0.5">Мут до: {formatDate(u.muteUntil)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm hidden sm:table-cell">
                            {u.isActive ? (
                              <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Активен</span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1"><Ban className="w-3.5 h-3.5" /> Заблокирован</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{u.totalCreated}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleBlockClick(u.id, u.username, u.isActive)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={u.isActive ? 'Заблокировать' : 'Разблокировать'}>
                                {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              {u.muteUntil && new Date(u.muteUntil) > new Date() ? (
                                <button onClick={() => handleUnmute(u.id)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="Снять мут">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => handleMuteClick(u.id, u.username)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Запретить публикацию">
                                  <Clock className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={userPage} totalPages={userTotalPages} onPage={setUserPage} />
            </>
          )}
        </>
      )}

      {/* Модалка просмотра филворда */}
      {selectedId && (
        <ModerationModal fillwordId={selectedId} onClose={() => setSelectedId(null)} onAction={fetchQueue} />
      )}

      {/* Модалка удаления филворда */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteId(null); setDeleteReason('') }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Удалить филворд</h2>
            <p className="text-slate-500 text-sm mb-1"><strong>{deleteTitle}</strong></p>
            <textarea className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:outline-none resize-none text-sm" rows={3} placeholder="Причина удаления..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setDeleteId(null); setDeleteReason('') }} className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
              <button onClick={handleDelete} disabled={!deleteReason.trim()} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка блокировки */}
      {blockUserId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBlockUserId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">{blockAction === 'block' ? 'Заблокировать' : 'Разблокировать'} пользователя</h2>
            <p className="text-slate-500 text-sm mb-4">Пользователь: <strong>{blockUsername}</strong></p>
            {blockAction === 'block' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-600 mb-1">Причина блокировки</label>
                <textarea className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:outline-none resize-none text-sm" rows={3} placeholder="Причина..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setBlockUserId(null)} className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
              <button onClick={confirmBlock} className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold ${blockAction === 'block' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {blockAction === 'block' ? 'Заблокировать' : 'Разблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка мута */}
      {muteUserId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMuteUserId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Запрет публикации</h2>
            <p className="text-slate-500 text-sm mb-4">Пользователь: <strong>{muteUsername}</strong></p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Длительность</label>
              <select value={muteMinutes} onChange={(e) => setMuteMinutes(parseInt(e.target.value))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm bg-white">
                <option value={30}>30 минут</option>
                <option value={60}>1 час</option>
                <option value={360}>6 часов</option>
                <option value={1440}>24 часа</option>
                <option value={10080}>7 дней</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Причина</label>
              <textarea className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none resize-none text-sm" rows={2} placeholder="Причина запрета..." value={muteReason} onChange={(e) => setMuteReason(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMuteUserId(null)} className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
              <button onClick={confirmMute} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600">Запретить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}