import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { FillwordDetail } from '../types'
import client from '../api/client'

interface Props {
  fillwordId: number
  onClose: () => void
  onAction: () => void
}

export default function ModerationModal({ fillwordId, onClose, onAction }: Props) {
  const [fillword, setFillword] = useState<FillwordDetail | null>(null)
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    client.get(`/moderation/queue/${fillwordId}`).then(({ data }) => setFillword(data)).catch(console.error)
  }, [fillwordId])

  const approve = async () => {
    setLoading(true)
    try {
      await client.put(`/moderation/queue/${fillwordId}/approve`)
      onAction()
      onClose()
    } catch { alert('Ошибка при публикации') }
    finally { setLoading(false) }
  }

  const reject = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await client.put(`/moderation/queue/${fillwordId}/reject`, { rejectionReason: reason })
      onAction()
      onClose()
    } catch { alert('Ошибка при отклонении') }
    finally { setLoading(false) }
  }

  if (!fillword) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{fillword.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-slate-500 mb-4">Автор: {fillword.creatorUsername} • {fillword.topic} • {fillword.totalWordsCount} слов</p>
        
        {/* Grid preview */}
        <div className="flex justify-center mb-4">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${fillword.width}, minmax(0, 1fr))` }}>
            {fillword.grid.map((row, r) => row.map((l, c) => (
              <div key={`${r}-${c}`} className="w-8 h-8 flex items-center justify-center font-bold text-xs bg-slate-50 border border-slate-200 rounded">{l}</div>
            )))}
          </div>
        </div>

        {/* Words */}
        <div className="flex flex-wrap gap-2 mb-4">
          {fillword.words.map((w) => (
            <span key={w.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm font-medium">{w.word}</span>
          ))}
        </div>

        {/* Reason input */}
        {showReason && (
          <textarea
            className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl mb-4 focus:border-red-400 focus:ring-4 focus:ring-red-50 focus:outline-none"
            rows={2}
            placeholder="Причина отклонения..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showReason ? (
            <>
              <button onClick={approve} disabled={loading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Опубликовать
              </button>
              <button onClick={() => setShowReason(true)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Отклонить
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowReason(false)} className="px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Назад</button>
              <button onClick={reject} disabled={loading || !reason.trim()} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50">Подтвердить отклонение</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}