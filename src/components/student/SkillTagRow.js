import { Chip } from '@/components/ui'

/**
 * Reference: "MY SKILLS" blocks on Concierge and My Profile — lavender skill
 * chips followed by a dashed-feeling "+ Add Skill" affordance.
 */
export default function SkillTagRow({ skills = [], onAdd }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {skills.map((skill) => (
        <Chip key={skill} tone="skill" size="lg">
          {skill}
        </Chip>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-6 items-center rounded-full bg-canvas px-3 text-xs font-semibold text-muted transition-colors hover:text-ink"
      >
        + Add Skill
      </button>
    </div>
  )
}
