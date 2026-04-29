import { Badge, Card } from '@tremor/react'

export default function SGLGPlaceholder({
  title = 'SGLG Dashboard',
  message = 'SGLG dashboard will be added soon.',
}) {
  return (
    <Card className="border border-slate-200 bg-white p-8 shadow-panel">
      <Badge color="amber">Placeholder</Badge>
      <h2 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </Card>
  )
}
