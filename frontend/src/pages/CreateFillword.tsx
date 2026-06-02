import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Grid3X3, Send } from 'lucide-react'
import AiGenerateButton from '../components/AiGenerateButton'
import client from '../api/client'

export default function CreateFillword() {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [width, setWidth] = useState(10)
  const [height, setHeight] = useState(10)
  const [wordsText, setWordsText] = useState('')
  const [previewGrid, setPreviewGrid] = useState<string[][] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const navigate = useNavigate()

  const wordsArray = wordsText.split('\n').map(w => w.trim()).filter(w => w.length > 0)

  const handlePreview = async () => {
    setError('')
    if (!title.trim()) { setError('Введите название'); return }
    if (!topic.trim()) { setError('Введите тему'); return }
    if (wordsArray.length < 5) { setError('Минимум 5 слов'); return }

    setLoading(true)
    try {
      const { data } = await client.post('/fillwords', {
        title: title.trim(),
        topic: topic.trim(),
        width,
        height,
        words: wordsArray,
      })
      setPreviewGrid(data.grid || null)
      setCreated(true)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  const handleAiWords = (words: string[]) => {
    setWordsText(words.join('\n'))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8 text-center">Создать филворд</h1>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-600 mb-1">Название</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Мой филворд" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none" />
      </div>

      {/* Topic */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-600 mb-1">Тема</label>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Космос" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none" />
      </div>

      {/* Size */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-600 mb-1">Размер сетки</label>
        <div className="flex gap-3">
          {[
            [10, 10, '10×10 (лёгкий)'],
            [15, 15, '15×15 (средний)'],
            [20, 20, '20×20 (сложный)'],
          ].map(([w, h, label]) => (
            <button key={w} onClick={() => { setWidth(w); setHeight(h) }} className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm border-2 transition-all ${width === w ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Words */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-slate-600">Слова (минимум 5)</label>
          <AiGenerateButton topic={topic} onWords={handleAiWords} />
        </div>
        <textarea value={wordsText} onChange={(e) => setWordsText(e.target.value)} placeholder={'Каждое слово с новой строки:\nзвезда\nпланета\nкомета\nгалактика\nорбита\nспутник'} rows={8} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 focus:outline-none resize-none font-mono text-sm" />
        <p className="text-xs text-slate-400 mt-1">Слов: {wordsArray.length}</p>
      </div>

      {/* Error */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {/* Preview grid */}
      {previewGrid && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Grid3X3 className="w-4 h-4" /> Предпросмотр</h3>
          <div className="flex justify-center">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}>
              {previewGrid.map((row, r) => row.map((l, c) => (
                <div key={`${r}-${c}`} className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-white border border-slate-200 rounded">{l}</div>
              )))}
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button onClick={handlePreview} disabled={loading} className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? 'Генерация...' : created ? 'Пересоздать филворд' : <><Send className="w-5 h-5" /> Создать филворд</>}
      </button>
      {created && (
        <p className="text-center text-sm text-emerald-600 mt-3 font-medium">✅ Филворд создан и отправлен на модерацию!</p>
      )}
      <button onClick={() => navigate('/profile')} className="w-full mt-3 px-6 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">
        Перейти в мои филворды
      </button>
    </div>
  )
}