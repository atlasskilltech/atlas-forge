import { cn } from '@/lib/utils'
import Card from './Card'

/**
 * Reference: /reference/mast ui/Founder/Contact Log.png and
 *            /reference/mast ui/SA/Platform Overview.png
 *
 * Shared table shell: muted header strip, hairline row rules, first column
 * emphasised. Used by every log/report screen across the manager roles.
 *
 * Desktop only by design — each screen pairs it with a card list below `lg`,
 * because none of the mobile references show a table.
 *
 * @param {object} props
 * @param {Array<{key:string,label:string,className?:string}>} props.columns
 * @param {Array<object>} props.rows  Row objects keyed by column key. Values may
 *   be strings or nodes; `row.id` is used as the React key.
 */
export default function DataTable({ columns, rows, caption, className }) {
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line bg-canvas">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-6 py-3.5 text-[13px] font-medium text-muted',
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-6 py-4 text-sm',
                      index === 0 ? 'font-bold text-ink' : 'text-muted',
                      column.className
                    )}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
