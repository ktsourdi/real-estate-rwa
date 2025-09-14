export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(req: Request): Promise<Response> {
  try {
    const jwt = process.env.PINATA_JWT
    if (!jwt) return new Response(JSON.stringify({ error: 'Missing PINATA_JWT' }), { status: 500 })

    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || ''
    if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400 })

    // Search pinned JSON by metadata name
    const listUrl = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${encodeURIComponent(name)}`
    const list = await fetchJson(listUrl, { headers: { Authorization: `Bearer ${jwt}` } })
    const rows = (list?.rows || []) as any[]
    if (!rows.length) return Response.json({ tokenURI: null, imageURI: null })
    const cid = rows[0]?.ipfs_pin_hash
    if (!cid) return Response.json({ tokenURI: null, imageURI: null })

    const meta = await fetchJson(`https://gateway.pinata.cloud/ipfs/${cid}`)
    const imageURI = typeof meta?.image === 'string' ? meta.image : null
    const tokenURI = `ipfs://${cid}`
    return Response.json({ tokenURI, imageURI })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unknown error' }), { status: 500 })
  }
}


