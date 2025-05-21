import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return { session, user: session.user }
}

export async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  return await supabase.auth.getSession()
}
