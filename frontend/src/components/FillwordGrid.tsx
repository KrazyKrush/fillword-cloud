import { useState, useCallback } from 'react'

interface Cell {
  row: number
  col: number
}

interface Props {
  grid: string[][]
  width: number
  height: number
  isInteractive: boolean
  onWordSelect?: (cells: Cell[]) => void
  foundCells?: Set<string>
}

export default function FillwordGrid({ grid, width, height, isInteractive, onWordSelect, foundCells }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)
  const [start, setStart] = useState<Cell | null>(null)

  const key = (r: number, c: number) => `${r}-${c}`
  const isFound = (r: number, c: number) => foundCells?.has(key(r, c)) || false
  const isSel = (r: number, c: number) => selected.has(key(r, c))

  const clear = useCallback(() => {
    setSelected(new Set())
    setSelecting(false)
    setStart(null)
  }, [])

  const handleDown = (r: number, c: number) => {
    if (!isInteractive || isFound(r, c)) return
    setSelecting(true)
    setStart({ row: r, col: c })
    setSelected(new Set([key(r, c)]))
  }

  const handleEnter = (r: number, c: number) => {
    if (!selecting || !start) return
    const s = new Set<string>()
    const dr = Math.sign(r - start.row)
    const dc = Math.sign(c - start.col)
    const steps = Math.max(Math.abs(r - start.row), Math.abs(c - start.col))
    for (let i = 0; i <= steps; i++) {
      const cr = start.row + dr * i
      const cc = start.col + dc * i
      if (cr >= 0 && cr < height && cc >= 0 && cc < width && !isFound(cr, cc)) {
        s.add(key(cr, cc))
      }
    }
    setSelected(s)
  }

  const handleUp = () => {
    if (!selecting || !onWordSelect || selected.size === 0) { clear(); return }
    const cells: Cell[] = Array.from(selected).map((k) => {
      const [r, c] = k.split('-').map(Number)
      return { row: r, col: c }
    })
    onWordSelect(cells)
    clear()
  }

  return (
    <div
      className="inline-grid gap-1 select-none"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      onMouseLeave={clear}
      onMouseUp={handleUp}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const found = isFound(r, c)
          const sel = isSel(r, c)
          return (
            <div
              key={`${r}-${c}`}
              onMouseDown={() => handleDown(r, c)}
              onMouseEnter={() => handleEnter(r, c)}
              className={`w-10 h-10 flex items-center justify-center font-bold text-sm rounded-md border-2 transition-all cursor-pointer select-none
                ${found ? 'bg-emerald-200 border-emerald-400 text-emerald-800' : ''}
                ${sel && !found ? 'bg-blue-200 border-blue-400 text-blue-800' : ''}
                ${!found && !sel ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300' : ''}
              `}
            >
              {letter}
            </div>
          )
        })
      )}
    </div>
  )
}