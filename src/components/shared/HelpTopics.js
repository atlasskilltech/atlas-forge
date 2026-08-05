import Link from 'next/link'
import { Card } from '@/components/ui'

/**
 * NOTE: the reference set contains no Help screen for any role. This component
 * is built strictly from existing design-system pieces so no invented visual
 * language enters the product — replace it once a Help design is supplied.
 *
 * @param {{title:string, detail:string, href:string}[]} topics
 */
export default function HelpTopics({ topics = [] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {topics.map((topic) => (
        <li key={topic.title}>
          <Card as={Link} href={topic.href} padding="lg" interactive className="block">
            <p className="text-[15px] font-bold text-ink">{topic.title}</p>
            <p className="mt-1.5 text-[13px] leading-[18px] text-muted">{topic.detail}</p>
          </Card>
        </li>
      ))}
    </ul>
  )
}
