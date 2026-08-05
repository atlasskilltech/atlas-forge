import { AppShell } from '@/components/layout'
import { PostCollabForm } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Post a Collab',
  description: 'Post a collaboration request for your project or idea.',
  path: '/student/post-collab',
  noIndex: true,
})

export default function StudentPostCollabPage() {
  return (
    <AppShell role={ROLES.STUDENT} mobileTitle="Post a Collab" backHref="/student/home">
      <PageTitle className="lg:mb-4">Post a Collab</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        <span className="lg:hidden">Looking for a collaborator? Reviewed by Mihir.</span>
        <span className="hidden lg:inline">
          Looking for a collaborator on your project? Post here. All collab posts go to
          Mihir for approval before going live.
        </span>
      </Subtle>
      <PostCollabForm />
    </AppShell>
  )
}
