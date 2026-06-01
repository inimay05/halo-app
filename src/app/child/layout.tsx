import { Nunito }        from 'next/font/google'
import { cookies }       from 'next/headers'
import { createClient }  from '@/lib/supabase/server'
import { ChildShell }    from '@/components/child/ChildShell'
import { COLORS }        from '@/config/tokens'
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
    const cookieStore = await cookies()
    const activeChildId = cookieStore.get('active_child_id')?.value

    if (activeChildId) {
      // Try loading the specific child stored in cookie
      const { data } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', activeChildId)
        .eq('parent_id', user.id)
        .single()
      profile = (data as ChildProfile) ?? null
    }

    if (!profile) {
      // Fall back to first child (cookie will be set when parent navigates properly)
      const { data } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at')
        .limit(1)
        .single()
      profile = (data as ChildProfile) ?? null
    }
  }

  if (!profile) {
    return (
      <div className={nunito.variable} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
        <div style={{ textAlign: 'center', marginTop: 80, color: COLORS.muted, fontSize: 18 }}>
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
