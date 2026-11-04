import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/wallets')({
  beforeLoad: () => {
    throw redirect({ to: '/profile/wallets' })
  },
  component: () => null,
})
