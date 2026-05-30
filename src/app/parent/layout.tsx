import { Nunito }         from 'next/font/google'
import { createClient }   from '@/lib/supabase/server'
import { ParentShell }    from '@/components/parent/ParentShell'
import type { ChildProfile } from '@/types/database'
import type { Metadata }  from 'next'

export const metadata: Metadata = { title: 'Halo – Parent Dashboard' }

const nunito = Nunito({
  subsets:  ['latin'],
  variable: '--font-nunito',
  weight:   ['400', '600', '700', '800'],
})

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profiles: ChildProfile[] = []
  if (user) {
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at')
    profiles = (data as ChildProfile[]) ?? []
  }

  return (
    <div className={nunito.variable} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
      <ParentShell profiles={profiles}>{children}</ParentShell>
    </div>
  )
}
