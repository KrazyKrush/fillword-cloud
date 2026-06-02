import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import client from '../api/client'

interface Props {
  topic: string
  onWords: (words: string[]) => void
}

export default function AiGenerateButton({ topic, onWords }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const { data } = await client.post('/ai/generate-words', { topic: topic.trim(), count: 12 })
      onWords(data.words)
      if (data.isFallback) alert(data.message || 'Сервис ИИ недоступен. Использованы локальные слова.')
    } catch {
      alert('Ошибка генерации слов. Проверьте подключение.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !topic.trim()}
        className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Генерация...' : 'Сгенерировать слова через ИИ'}
      </button>
      <p className="text-xs text-slate-400 mt-1">Работает на GigaChat от Сбера</p>
    </div>
  )
}