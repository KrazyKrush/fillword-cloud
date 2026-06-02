import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  startTime: string
  isCompleted: boolean
  finalTime?: number
}

export default function Timer({ startTime, isCompleted, finalTime }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (isCompleted && finalTime) { setElapsed(finalTime); return }
    const start = new Date(startTime).getTime()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200)
    return () => clearInterval(id)
  }, [startTime, isCompleted, finalTime])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return (
    <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${isCompleted ? 'text-emerald-500' : 'text-indigo-600'}`}>
      <Clock className="w-6 h-6" />
      <span>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
    </div>
  )
}