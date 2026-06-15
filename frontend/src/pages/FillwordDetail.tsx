import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Trophy, Download, StopCircle, RotateCcw } from 'lucide-react'
import FillwordGrid from '../components/FillwordGrid'
import Timer from '../components/Timer'
import WordList from '../components/WordList'
import DifficultyBadge from '../components/DifficultyBadge'
import client from '../api/client'

interface FillwordWord {
  id: number
  word: string
  direction: string
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

interface FillwordDetailType {
  id: number
  title: string
  topic: string
  difficulty: string
  status: string
  width: number
  height: number
  grid: string[][]
  words: FillwordWord[]
  creatorUsername: string
  rejectionReason: string | null
  totalWordsCount: number
  createdAt: string
}

interface SolveSession {
  resultId: number | string
  fillwordId: number
  startedAt: string
  totalWordsCount: number
  isCompleted: boolean
}

interface CheckWordResponse {
  isCorrect: boolean
  wordFound?: string
  wordsFoundCount: number
  totalWordsCount: number
  isCompleted: boolean
  timeSeconds: number
  errorsCount: number
}

export default function FillwordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fillword, setFillword] = useState<FillwordDetailType | null>(null)
  const [session, setSession] = useState<SolveSession | null>(null)
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<number>(0)
  const [completed, setCompleted] = useState<boolean>(false)
  const [finalTime, setFinalTime] = useState<number>(0)
  const [mode, setMode] = useState<'view' | 'solve'>('view')
  const [showCongrats, setShowCongrats] = useState<boolean>(false)
  const [showEarlyStop, setShowEarlyStop] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isReplay, setIsReplay] = useState<boolean>(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setSession(null)
    setMode('view')
    setFoundWords([])
    setFoundCells(new Set())
    setErrors(0)
    setCompleted(false)
    setFinalTime(0)
    setIsReplay(false)

    client.get(`/fillwords/${id}`)
      .then((res: any) => setFillword(res.data))
      .catch(() => alert('Не удалось загрузить филворд'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => {
      setSession(null)
      setMode('view')
    }
  }, [])

  const startSolve = async (replay: boolean = false) => {
    if (!id) return
    try {
      const res = await client.post(`/solve/${id}/start`)
      const data: SolveSession = res.data
      setSession(data)
      setMode('solve')
      setFoundWords([])
      setFoundCells(new Set())
      setErrors(0)
      setCompleted(false)
      setFinalTime(0)
      setIsReplay(replay)
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const resetSolve = async () => {
    await startSolve(true)
  }

  const earlyStop = () => {
    const timeSeconds: number = session
      ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
      : 0
    setFinalTime(timeSeconds)
    setShowEarlyStop(true)
  }

  const handleWordSelect = useCallback(async (cells: { row: number; col: number }[]) => {
    if (!session || !fillword) return

    const word: string = cells.map((c: { row: number; col: number }) => fillword.grid[c.row][c.col] || '').join('')
    try {
      const res = await client.post(`/solve/${session.resultId}/check-word`, { word, cells })
      const data: CheckWordResponse = res.data

      setErrors(Number(data.errorsCount))
      if (data.isCorrect && data.wordFound) {
        setFoundWords((prev: string[]) => [...prev, data.wordFound!])
        const newFoundCells = new Set(foundCells)
        cells.forEach((c: { row: number; col: number }) => newFoundCells.add(`${c.row}-${c.col}`))
        setFoundCells(newFoundCells)
      }
      if (data.isCompleted) {
        setCompleted(true)
        setFinalTime(Number(data.timeSeconds))
        setShowCongrats(true)
      }
    } catch (e: any) {
      console.error('Ошибка проверки:', e)
    }
  }, [session, completed, fillword, foundCells, isReplay])

  const goToPDF = () => {
    if (id) navigate(`/fillword/${id}/pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 ml-3">Загрузка...</p>
      </div>
    )
  }

  if (!fillword) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg mb-4">Филворд не найден</p>
        <Link to="/" className="text-indigo-600 font-semibold hover:underline">Вернуться в каталог</Link>
      </div>
    )
  }

  const allWords: string[] = fillword.words.map((w: FillwordWord) => w.word)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>
        {isReplay && (
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">Повторное решение</span>
        )}
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold text-slate-800">{fillword.title}</h1>
          <DifficultyBadge difficulty={fillword.difficulty} />
        </div>
        <p className="text-slate-500 text-sm">{fillword.topic} &bull; {fillword.creatorUsername}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="flex flex-col items-center gap-4">
          <FillwordGrid
            grid={fillword.grid}
            width={fillword.width}
            height={fillword.height}
            isInteractive={mode === 'solve'}
            onWordSelect={handleWordSelect}
            foundCells={foundCells}
          />

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {mode === 'view' ? (
              <>
                <button onClick={() => startSolve(false)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
                  <Play className="w-4 h-4" /> Разгадывать
                </button>
                {completed && (
                  <button onClick={() => startSolve(true)} className="px-5 py-2.5 border-2 border-amber-200 rounded-xl font-semibold text-amber-700 hover:bg-amber-50 transition-all flex items-center gap-2 text-sm">
                    <RotateCcw className="w-4 h-4" /> Перерешать
                  </button>
                )}
                <button onClick={goToPDF} className="px-5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> Скачать PDF
                </button>
              </>
            ) : (
              <>
                <Timer startTime={session?.startedAt || ''} isCompleted={completed} finalTime={finalTime} />
                {!completed && (
                  <>
                    <button onClick={resetSolve} className="px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                      <RotateCcw className="w-4 h-4" /> Сбросить
                    </button>
                    <button onClick={earlyStop} className="px-4 py-2.5 border-2 border-orange-200 rounded-xl font-semibold text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2 text-sm">
                      <StopCircle className="w-4 h-4" /> Завершить
                    </button>
                  </>
                )}
                <button onClick={goToPDF} className="px-5 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-64">
          <WordList words={allWords} foundWords={foundWords} />
          {mode === 'solve' && (
            <div className="mt-4 text-sm text-slate-500 text-center">
              Найдено: <strong className="text-indigo-600">{foundWords.length}</strong> из {allWords.length}
              &nbsp;|&nbsp; Ошибок: <strong className="text-red-500">{errors}</strong>
            </div>
          )}
        </div>
      </div>

      {showCongrats && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{isReplay ? 'Повторное решение' : 'Поздравляем!'}</h2>
            <p className="text-slate-500 mb-4">{isReplay ? 'Вы перерешали филворд!' : 'Вы нашли все слова!'}</p>
            <p className="text-lg font-mono font-bold text-indigo-600 mb-2">
              {String(Math.floor(finalTime / 60)).padStart(2, '0')}:{String(finalTime % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-slate-400 mb-2">Найдено: <strong>{foundWords.length}</strong> из {allWords.length}</p>
            <p className="text-sm text-slate-400 mb-2">Ошибок: <strong>{errors}</strong></p>
            {isReplay && <p className="text-xs text-amber-600 mb-4">Результат не учитывается в рейтинге</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowCongrats(false); setMode('view') }} className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all">Закрыть</button>
              <button onClick={() => { setShowCongrats(false); resetSolve() }} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all">Ещё раз</button>
            </div>
          </div>
        </div>
      )}

      {showEarlyStop && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <StopCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Разгадывание завершено</h2>
            <p className="text-slate-500 mb-4">Вы не нашли все слова</p>
            <p className="text-lg font-mono font-bold text-indigo-600 mb-2">
              {String(Math.floor(finalTime / 60)).padStart(2, '0')}:{String(finalTime % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-slate-400 mb-2">Найдено: <strong>{foundWords.length}</strong> из {allWords.length}</p>
            <p className="text-sm text-slate-400 mb-6">Ошибок: <strong>{errors}</strong></p>
            <div className="flex gap-3">
              <button onClick={() => setShowEarlyStop(false)} className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all">Продолжить</button>
              <button onClick={() => { setShowEarlyStop(false); setMode('view') }} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all">Выйти</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}