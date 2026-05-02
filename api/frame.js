export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob token missing' });
  }

  const blobUrl = req.query?.url;
  if (!blobUrl || typeof blobUrl !== 'string') {
    return res.status(400).json({ error: 'Missing blob URL' });
  }

  let url;
  try {
    url = new URL(blobUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid blob URL' });
  }

  if (!url.hostname.endsWith('.blob.vercel-storage.com')) {
    return res.status(400).json({ error: 'Invalid blob host' });
  }

  const blobResp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!blobResp.ok) {
    return res.status(blobResp.status).json({ error: 'Frame not found' });
  }

  const contentType = blobResp.headers.get('content-type') || 'image/png';
  const cacheControl = blobResp.headers.get('cache-control') || 'public, max-age=31536000, immutable';
  const bytes = Buffer.from(await blobResp.arrayBuffer());

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', cacheControl);
  return res.status(200).send(bytes);
}
