import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { FillwordDetail as FillwordDetailType } from '../types'
import client from '../api/client'

export default function FillwordPDF() {
  const { id } = useParams<{ id: string }>()
  const [fillword, setFillword] = useState<FillwordDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    client.get(`/fillwords/${id}`)
      .then(({ data }: { data: FillwordDetailType }) => setFillword(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const getDifficultyLabel = (diff: string): string => {
    switch (diff) {
      case 'easy': return 'Лёгкий'
      case 'medium': return 'Средний'
      case 'hard': return 'Сложный'
      default: return diff
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!fillword) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">Филворд не найден</p>
          <Link to="/" className="text-indigo-600 font-semibold hover:underline">Вернуться в каталог</Link>
        </div>
      </div>
    )
  }

  const formattedDate: string = new Date(fillword.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Панель управления */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 no-print">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={`/fillword/${id}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Назад к филворду
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" /> Сохранить PDF
            </button>
          </div>
        </div>
      </div>

      {/* Контент для печати */}
      <div ref={contentRef} className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 print:shadow-none print:border-none print:p-0">
          {/* Заголовок */}
          <div className="text-center mb-8 pb-6 border-b-2 border-indigo-100">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{fillword.title}</h1>
            <p className="text-slate-500 text-sm">
              Тема: {fillword.topic} &nbsp;|&nbsp; {getDifficultyLabel(fillword.difficulty)} &nbsp;|&nbsp; {fillword.totalWordsCount} слов
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Создан: {formattedDate} &nbsp;|&nbsp; Автор: {fillword.creatorUsername}
            </p>
          </div>

          {/* Сетка */}
          <div className="flex justify-center mb-8">
            <table className="border-collapse border-2 border-indigo-200">
              <tbody>
                {fillword.grid.map((row: string[], r: number) => (
                  <tr key={r}>
                    {row.map((letter: string, c: number) => (
                      <td
                        key={`${r}-${c}`}
                        className="w-8 h-8 sm:w-9 sm:h-9 text-center border border-slate-200 font-bold text-sm sm:text-base bg-slate-50 text-slate-700 uppercase"
                        style={{ fontFamily: "'Courier New', monospace" }}
                      >
                        {letter}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Слова */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">
              Слова для поиска ({fillword.words.length})
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {fillword.words.map((w: any) => (
                <span
                  key={w.id}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-indigo-700"
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Подвал */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Сгенерировано на <span className="font-semibold text-indigo-500">FillWord Cloud</span> &copy; 2026
            </p>
            <p className="text-xs text-slate-400 mt-1">Курсовой проект РТУ МИРЭА &bull; Создание программного обеспечения</p>
          </div>
        </div>
      </div>

      {/* Стили для печати */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-slate-50 { background: white !important; }
        }
        @page {
          margin: 12mm;
          size: A4;
        }
      `}</style>
    </div>
  )
}