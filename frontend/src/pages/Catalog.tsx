import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import FillwordCard from '../components/FillwordCard'
import Pagination from '../components/Pagination'
import { FillwordCard as FillwordCardType, PaginatedResponse } from '../types'
import client from '../api/client'

export default function Catalog() {
  const [fillwords, setFillwords] = useState<FillwordCardType[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/fillwords', {
      params: { page, size: 20, topic: topic || undefined, difficulty: difficulty || undefined }
    })
      .then(({ data }: { data: PaginatedResponse<FillwordCardType> }) => {
        setFillwords(data.content)
        setTotalPages(data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, topic, difficulty])

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Каталог филвордов</h1>
        <p className="text-slate-500">Выбирайте, разгадывайте, соревнуйтесь!</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по теме..."
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPage(1) }}
          className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none bg-white"
        >
          <option value="">Все сложности</option>
          <option value="easy">Лёгкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      ) : fillwords.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Филворды не найдены</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fillwords.map((fw) => (
            <FillwordCard key={fw.id} fillword={fw} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}