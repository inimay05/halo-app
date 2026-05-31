import { redirect } from 'next/navigation'

// /dashboard is a legacy route from the (parent) route group.
// The real parent overview lives at /parent (ParentShell + parent/page.tsx).
// Redirect any direct hits so nothing is unprotected or dead-ended.
export default function DashboardRedirect() {
  redirect('/parent')
}
