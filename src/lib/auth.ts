import { auth, currentUser } from '@clerk/nextjs'
import { prisma } from './db'

export async function getOrCreateUser() {
  const { userId: clerkId } = auth()
  
  if (!clerkId) {
    return null
  }

  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return null
  }

  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { goal: true },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      },
      include: { goal: true },
    })
  }

  return user
}

export async function requireUser() {
  const user = await getOrCreateUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export function hasProSubscription(subscriptionStatus: string): boolean {
  return subscriptionStatus === 'active' || subscriptionStatus === 'trial'
}
