interface Props { difficulty: string }

export default function DifficultyBadge({ difficulty }: Props) {
  const map: Record<string, { label: string; cls: string }> = {
    easy: { label: 'Лёгкий', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    medium: { label: 'Средний', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    hard: { label: 'Сложный', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const { label, cls } = map[difficulty] || map.easy
  return <span className={`inline-flex items-center border rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}