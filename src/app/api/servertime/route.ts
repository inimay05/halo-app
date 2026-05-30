export function GET() {
  return Response.json({ ts: Date.now() })
}
