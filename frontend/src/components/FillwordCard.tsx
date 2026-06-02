import { Link } from 'react-router-dom'
import { Eye, Grid3X3 } from 'lucide-react'
import DifficultyBadge from './DifficultyBadge'
import { FillwordCard as FC } from '../types'

export default function FillwordCard({ fillword }: { fillword: FC }) {
  return (
    <Link to={`/fillword/${fillword.id}`}>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">{fillword.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{fillword.topic}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center">
            <Grid3X3 className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <DifficultyBadge difficulty={fillword.difficulty} />
          <span className="text-sm text-slate-500 flex items-center gap-1"><Grid3X3 className="w-3.5 h-3.5" /> {fillword.totalWordsCount} слов</span>
        </div>
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">{fillword.creatorUsername}</span>
          <span className="text-slate-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {fillword.viewsCount}</span>
        </div>
      </div>
    </Link>
  )
}