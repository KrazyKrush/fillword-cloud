import { Grid3X3 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 py-8 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Grid3X3 className="w-4 h-4" /> FillWord Cloud © 2026
        </div>
        <div>Курсовой проект • РТУ МИРЭА • Создание ПО</div>
      </div>
    </footer>
  )
}