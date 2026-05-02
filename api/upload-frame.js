import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Blob token missing',
      detail: 'Connect a Vercel Blob store to this project or add BLOB_READ_WRITE_TOKEN in Vercel project environment variables.',
    });
  }

  const { frameDataUrl, frameName = 'frame' } = req.body ?? {};

  if (!frameDataUrl?.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid frame data' });
  }

  const [meta, base64] = frameDataUrl.split(',');
  const contentType = meta.match(/data:(.*);/)?.[1] ?? 'image/png';
  const ext = contentType === 'image/jpeg' ? 'jpg' : 'png';
  const buffer = Buffer.from(base64, 'base64');

  const safeName = (frameName || 'frame')
    .replace(/[^a-z0-9\-_]/gi, '-')
    .toLowerCase()
    .slice(0, 40);
  const filename = `frames/${Date.now()}-${safeName}.${ext}`;

  try {
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: blob.url, access: 'public' });
  } catch (err) {
    const message = err?.message || 'Vercel Blob upload failed';
    const privateStore = /private store/i.test(message) || /configured with private access/i.test(message);
    if (privateStore) {
      try {
        const blob = await put(filename, buffer, {
          access: 'private',
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: true,
        });
        const proxyUrl = `/api/frame?url=${encodeURIComponent(blob.url)}`;
        return res.status(200).json({ url: proxyUrl, access: 'private' });
      } catch (privateErr) {
        console.error('[upload-frame] Private Blob error:', privateErr);
        return res.status(500).json({
          error: 'Upload failed',
          detail: privateErr?.message || 'Private Vercel Blob upload failed',
        });
      }
    }

    console.error('[upload-frame] Blob error:', err);
    return res.status(500).json({
      error: 'Upload failed',
      detail: message,
    });
  }
}
