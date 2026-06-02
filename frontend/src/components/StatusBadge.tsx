interface Props { status: string }

export default function StatusBadge({ status }: Props) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'На модерации', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    published: { label: 'Опубликован', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Отклонён', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const { label, cls } = map[status] || map.pending
  return <span className={`inline-flex items-center border rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}