import { CheckCircle2 } from 'lucide-react'

interface Props {
  words: string[]
  foundWords: string[]
}

export default function WordList({ words, foundWords }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Слова ({foundWords.length}/{words.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {words.map((w, i) => {
          const isFound = foundWords.includes(w.toUpperCase())
          return (
            <div key={i} className={`px-3 py-2 rounded-lg text-sm font-medium border ${isFound ? 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <div className="flex items-center gap-1.5">
                {isFound && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                <span className="truncate">{w}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}