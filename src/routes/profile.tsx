import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProfileShell } from '@/components/profile/profile-shell'
import { requireSession } from '@/lib/auth'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: function ProfileLayout() {
    return (
      <ProfileShell>
        <Outlet />
      </ProfileShell>
    )
  },
})
