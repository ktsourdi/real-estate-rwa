'use client'

export async function uploadPropertyMetadata(params: {
  title: string
  description: string
  location: string
  imageFile?: File | null
  extras?: Record<string, any>
}): Promise<{ tokenURI: string, imageURI: string | null }> {
  const form = new FormData()
  form.set('title', params.title)
  form.set('description', params.description)
  form.set('location', params.location)
  form.set('extras', JSON.stringify(params.extras || {}))
  if (params.imageFile) form.set('image', params.imageFile)

  const res = await fetch('/api/pinata', { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  const json = await res.json()
  return { tokenURI: json.tokenURI as string, imageURI: (json.imageURI as string | null) ?? null }
}


