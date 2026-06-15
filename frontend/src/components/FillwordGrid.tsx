import { useState, useCallback, useRef } from 'react'

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
  const [selected, setSelected] = useState<Cell[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [lockDiagonal, setLockDiagonal] = useState<{ dr: number; dc: number } | null>(null)
  const lastCellRef = useRef<Cell | null>(null)

  const key = (r: number, c: number) => `${r}-${c}`
  const isFound = (r: number, c: number) => foundCells?.has(key(r, c)) || false
  const isSelected = (r: number, c: number) => selected.some(s => s.row === r && s.col === c)

  const isAdjacent = (from: Cell, to: Cell): boolean => {
    const dr = Math.abs(to.row - from.row)
    const dc = Math.abs(to.col - from.col)
    return dr <= 1 && dc <= 1 && (dr + dc > 0)
  }

  const clear = useCallback(() => {
    setSelected([])
    setIsDragging(false)
    setLockDiagonal(null)
    lastCellRef.current = null
  }, [])

  const handleMouseDown = (r: number, c: number) => {
    if (!isInteractive) return
    setIsDragging(true)
    setLockDiagonal(null)
    lastCellRef.current = { row: r, col: c }
    setSelected([{ row: r, col: c }])
  }

  const handleMouseEnter = (r: number, c: number) => {
    if (!isDragging || !lastCellRef.current) return

    const current: Cell = { row: r, col: c }
    const last = lastCellRef.current

    if (!isAdjacent(last, current)) return

    // Отмена последнего шага
    if (selected.length >= 2) {
      const prev = selected[selected.length - 2]
      if (prev.row === r && prev.col === c) {
        lastCellRef.current = prev
        setSelected(prev => prev.slice(0, -1))
        if (selected.length <= 2) setLockDiagonal(null)
        return
      }
    }

    // Не игнорируем уже выбранные ячейки (разрешено перевыделять)
    // if (isSelected(r, c)) return  ← убрано

    // Блокировка диагонали
    if (lockDiagonal) {
      const dr = current.row - last.row
      const dc = current.col - last.col
      if (dr !== lockDiagonal.dr || dc !== lockDiagonal.dc) return
    }

    if (!lockDiagonal && selected.length === 2) {
      const first = selected[0]
      const second = selected[1]
      const dr = second.row - first.row
      const dc = second.col - first.col
      if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
        setLockDiagonal({ dr, dc })
      }
    }

    lastCellRef.current = current
    setSelected(prev => [...prev, current])
  }

  const handleMouseUp = () => {
    if (!isDragging || !onWordSelect) {
      clear()
      return
    }
    if (selected.length > 0) {
      onWordSelect(selected)
    }
    clear()
  }

  return (
    <div
      className="inline-grid gap-0.5 select-none"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      onMouseLeave={clear}
      onMouseUp={handleMouseUp}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const found = isFound(r, c)
          const sel = isSelected(r, c)
          const isFirst = selected.length > 0 && selected[0].row === r && selected[0].col === c
          const isLast = selected.length > 0 && selected[selected.length - 1].row === r && selected[selected.length - 1].col === c

          let cellClass = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'

          if (found && sel) {
            cellClass = 'bg-emerald-300 border-emerald-500 text-emerald-900 ring-2 ring-blue-400'
          } else if (found) {
            cellClass = 'bg-emerald-100 border-emerald-300 text-emerald-800'
          } else if (sel) {
            cellClass = 'bg-blue-200 border-blue-400 text-blue-800'
            if (isFirst) cellClass += ' ring-2 ring-indigo-400'
            if (isLast) cellClass += ' ring-2 ring-blue-500'
          }

          return (
            <div
              key={`${r}-${c}`}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-base rounded border-2 transition-all duration-75 cursor-pointer select-none ${cellClass}`}
            >
              {letter}
            </div>
          )
        })
      )}
    </div>
  )
}