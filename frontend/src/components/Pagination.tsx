import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export default function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPage(p)} className={`w-10 h-10 rounded-xl font-medium text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronRight className="w-5 h-5" /></button>
    </div>
  )
}