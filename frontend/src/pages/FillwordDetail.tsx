import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play, Trophy } from 'lucide-react'
import FillwordGrid from '../components/FillwordGrid'
import Timer from '../components/Timer'
import WordList from '../components/WordList'
import DifficultyBadge from '../components/DifficultyBadge'
import { FillwordDetail as FillwordDetailType, SolveSession, CheckWordResponse } from '../types'
import client from '../api/client'

export default function FillwordDetail() {
  const { id } = useParams<{ id: string }>()
  const [fillword, setFillword] = useState<FillwordDetailType | null>(null)
  const [session, setSession] = useState<SolveSession | null>(null)
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [finalTime, setFinalTime] = useState(0)
  const [mode, setMode] = useState<'view' | 'solve'>('view')
  const [showCongrats, setShowCongrats] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    client.get(`/fillwords/${id}`)
      .then(({ data }: { data: FillwordDetailType }) => setFillword(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const startSolve = async () => {
    if (!id) return
    try {
      const { data }: { data: SolveSession } = await client.post(`/solve/${id}/start`)
      setSession(data)
      setMode('solve')
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const handleWordSelect = useCallback(async (cells: { row: number; col: number }[]) => {
    if (!session || completed) return
    const word = cells.map(c => fillword?.grid[c.row][c.col] || '').join('')
    try {
      const { data }: { data: CheckWordResponse } = await client.post(`/solve/${session.resultId}/check-word`, { word, cells })
      setErrors(data.errorsCount)
      if (data.isCorrect && data.wordFound) {
        setFoundWords(prev => [...prev, data.wordFound!])
        cells.forEach(c => setFoundCells(prev => new Set(prev).add(`${c.row}-${c.col}`)))
      }
      if (data.isCompleted) {
        setCompleted(true)
        setFinalTime(data.timeSeconds)
        setShowCongrats(true)
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка проверки слова')
    }
  }, [session, completed, fillword])

  if (loading) return <div className="text-center py-20 text-slate-400">Загрузка...</div>
  if (!fillword) return <div className="text-center py-20 text-slate-400">Филворд не найден</div>

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Назад в каталог
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">{fillword.title}</h1>
          <p className="text-slate-500 mt-1">{fillword.topic} • Автор: {fillword.creatorUsername}</p>
        </div>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={fillword.difficulty} />
          {mode === 'view' ? (
            <button onClick={startSolve} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2">
              <Play className="w-5 h-5" /> Начать разгадывание
            </button>
          ) : (
            <Timer startTime={session?.startedAt || ''} isCompleted={completed} finalTime={finalTime} />
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex justify-center">
          <FillwordGrid
            grid={fillword.grid}
            width={fillword.width}
            height={fillword.height}
            isInteractive={mode === 'solve' && !completed}
            onWordSelect={handleWordSelect}
            foundCells={foundCells}
          />
        </div>
        <div className="w-full lg:w-72">
          <WordList words={fillword.words.map(w => w.word)} foundWords={foundWords} />
          {mode === 'solve' && (
            <div className="mt-4 text-sm text-slate-500">
              Ошибок: <strong className="text-red-500">{errors}</strong>
            </div>
          )}
        </div>
      </div>

      {showCongrats && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">🎉 Поздравляем!</h2>
            <p className="text-slate-500 mb-4">Вы нашли все слова!</p>
            <p className="text-lg font-mono font-bold text-indigo-600 mb-2">
              {String(Math.floor(finalTime / 60)).padStart(2, '0')}:{String(finalTime % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-slate-400 mb-6">Ошибок: {errors}</p>
            <button onClick={() => setShowCongrats(false)} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}