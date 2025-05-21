import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

// Use cache to prevent multiple calls to getServerSession within the same render cycle
export const getServerSession = cache(async () => {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
})

export async function requireAuth() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return { session, user: session.user }
}
