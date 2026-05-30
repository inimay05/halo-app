import { Nunito }        from 'next/font/google'
import { createClient }  from '@/lib/supabase/server'
import { ChildShell }    from '@/components/child/ChildShell'
import type { ChildProfile } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Halo' }

const nunito = Nunito({
  subsets:  ['latin'],
  variable: '--font-nunito',
  weight:   ['400', '600', '700', '800'],
})

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: ChildProfile | null = null
  if (user) {
    // Load the first (or only) child profile linked to this parent session.
    // In production the active child_id would come from the session token.
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at')
      .limit(1)
      .single()
    profile = (data as ChildProfile) ?? null
  }

  if (!profile) {
    return (
      <div className={nunito.variable} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
        <div style={{ textAlign: 'center', marginTop: 80, color: '#6B6B80', fontSize: 18 }}>
          No child profile found.
        </div>
      </div>
    )
  }

  return (
    <div className={nunito.variable} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
      <ChildShell profile={profile}>{children}</ChildShell>
    </div>
  )
}
