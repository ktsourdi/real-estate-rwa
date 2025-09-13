export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  try {
    const jwt = process.env.PINATA_JWT
    if (!jwt) return new Response(JSON.stringify({ error: 'Missing PINATA_JWT' }), { status: 500 })

    const form = await req.formData()
    const title = String(form.get('title') || '')
    const description = String(form.get('description') || '')
    const location = String(form.get('location') || '')
    const extrasRaw = String(form.get('extras') || '{}')
    const image = form.get('image') as File | null

    let imageCid: string | null = null
    if (image) {
      const fileForm = new FormData()
      fileForm.append('file', image, image.name)
      const fileRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: fileForm,
      })
      if (!fileRes.ok) {
        const txt = await fileRes.text()
        return new Response(JSON.stringify({ error: 'pinFileToIPFS failed', details: txt }), { status: 500 })
      }
      const fileJson = await fileRes.json()
      imageCid = fileJson?.IpfsHash || null
    }

    const extras = (() => { try { return JSON.parse(extrasRaw || '{}') } catch { return {} } })()

    const metadata: any = {
      name: title,
      description,
      attributes: [
        { trait_type: 'location', value: location },
      ],
      ...extras,
    }
    if (imageCid) metadata.image = `ipfs://${imageCid}`

    const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pinataContent: metadata }),
    })
    if (!jsonRes.ok) {
      const txt = await jsonRes.text()
      return new Response(JSON.stringify({ error: 'pinJSONToIPFS failed', details: txt }), { status: 500 })
    }
    const json = await jsonRes.json()
    const metaCid = json?.IpfsHash
    return Response.json({ tokenURI: `ipfs://${metaCid}`, imageURI: imageCid ? `ipfs://${imageCid}` : null })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unknown error' }), { status: 500 })
  }
}


