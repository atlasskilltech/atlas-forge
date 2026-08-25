import { Chip } from '@/components/ui'

/**
 * Reference: "MY SKILLS" blocks on Service and My Profile — lavender skill
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
      {/* `PUT /api/student/skills` exists, but choosing a skill needs a picker
          the reference does not draw. Disabled when no handler is supplied
          rather than looking clickable and doing nothing. */}
      <button
        type="button"
        onClick={onAdd}
        disabled={!onAdd}
        title={onAdd ? undefined : 'Adding a skill needs a picker, which is not designed yet'}
        className="inline-flex h-6 items-center rounded-full bg-canvas px-3 text-xs font-semibold text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add Skill
      </button>
    </div>
  )
}
