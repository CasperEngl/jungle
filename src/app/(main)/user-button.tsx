'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export function UserAvatar() {
  const user = useUser()

  if (!user) {
    return 'loading...'
  }

  return (
    <UserButton
      appearance={{
        elements: {
          userButtonAvatarBox: {
            width: '5rem',
            height: '5rem',
          },
        },
      }}
    />
  )
}
