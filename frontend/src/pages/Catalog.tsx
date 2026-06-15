import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import FillwordCard from '../components/FillwordCard'
import Pagination from '../components/Pagination'
import { FillwordCard as FillwordCardType, PaginatedResponse } from '../types'
import client from '../api/client'

export default function Catalog() {
  const [fillwords, setFillwords] = useState<FillwordCardType[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const fetchFillwords = () => {
  setLoading(true)
  const params: any = { page, size: 20 }
  if (topic) params.topic = topic
  if (difficulty) params.difficulty = difficulty
  if (search) params.search = search

  client.get('/fillwords', { params })
    .then(({ data }: { data: PaginatedResponse<FillwordCardType> }) => {
      setFillwords(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    })
    .catch(console.error)
    .finally(() => setLoading(false))
}

  useEffect(() => {
    fetchFillwords()
  }, [page, topic, difficulty])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchFillwords()
  }

  const clearFilters = () => {
    setSearch('')
    setTopic('')
    setDifficulty('')
    setPage(1)
  }

  const hasFilters = search || topic || difficulty

  return (
    <div>
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Каталог филвордов</h1>
        <p className="text-slate-500">
          {totalElements > 0 
            ? `Найдено: ${totalElements} филвордов`
            : 'Выбирайте, разгадывайте, соревнуйтесь!'}
        </p>
      </div>

      {/* Поисковая строка */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию филворда..."
            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none text-slate-700 font-medium transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
          >
            Найти
          </button>
        </div>
      </form>

      {/* Фильтры */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${showFilters || hasFilters ? 'bg-indigo-100 text-indigo-700' : 'border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            <Filter className="w-4 h-4" />
            Фильтры
            {hasFilters && (
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">!</span>
            )}
          </button>

          {/* Быстрые кнопки тем */}
          {['Животные', 'Космос', 'География', 'Литература', 'Музыка', 'Наука'].map(t => (
            <button
              key={t}
              onClick={() => { setTopic(topic === t ? '' : t); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${topic === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              {t}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Сбросить
            </button>
          )}
        </div>

        {/* Расширенные фильтры */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Тема</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setPage(1) }}
                  placeholder="Любая тема"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Сложность</label>
                <select
                  value={difficulty}
                  onChange={(e) => { setDifficulty(e.target.value); setPage(1) }}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none text-sm bg-white"
                >
                  <option value="">Любая сложность</option>
                  <option value="easy">Лёгкий</option>
                  <option value="medium">Средний</option>
                  <option value="hard">Сложный</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Сетка филвордов */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 ml-3">Загрузка...</p>
        </div>
      ) : fillwords.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">Ничего не найдено</p>
          <p className="text-slate-400 text-sm mb-4">Попробуйте изменить параметры поиска</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-indigo-600 font-semibold hover:underline">
              Сбросить все фильтры
            </button>
          )}
        </div>
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