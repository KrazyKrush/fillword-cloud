import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import client from '../api/client'
import { FillwordDetail } from '../types'

export default function EditFillword() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fillword, setFillword] = useState<FillwordDetail | null>(null)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [wordsText, setWordsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    client.get(`/fillwords/${id}`)
      .then(({ data }: { data: FillwordDetail }) => {
        setFillword(data)
        setTitle(data.title)
        setTopic(data.topic)
        setWordsText(data.words.map(w => w.word).join('\n'))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const wordsArray = wordsText.split('\n').map(w => w.trim()).filter(w => w.length > 0)
      await client.put(`/fillwords/${id}`, {
        title, topic, words: wordsArray,
        width: fillword?.width, height: fillword?.height,
      })
      alert('Филворд обновлён и отправлен на повторную модерацию')
      navigate('/profile')
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка сохранения')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-20">Загрузка...</div>
  if (!fillword) return <div className="text-center py-20">Филворд не найден</div>

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <h1 className="text-3xl font-extrabold mb-8">Редактирование филворда</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Название</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Тема</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Слова (каждое с новой строки)</label>
          <textarea value={wordsText} onChange={(e) => setWordsText(e.target.value)} rows={10} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none font-mono text-sm" />
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {saving ? 'Сохранение...' : 'Сохранить и отправить на модерацию'}
        </button>
      </div>
    </div>
  )
}