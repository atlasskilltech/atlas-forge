import { ROLE_LIST } from '@/config/roles'
import { ASSIGNABLE_ROLES } from '@/lib/auth/role-policy'

/** The five roles, as options for the Backend Manager's "act as" switcher. */
export function actAsRoleOptions() {
  return ROLE_LIST.filter((role) => ASSIGNABLE_ROLES.includes(role.id)).map((role) => ({
    value: role.id,
    label: role.id === 'founder' ? 'Founder' : role.label,
    description: role.description,
  }))
}
