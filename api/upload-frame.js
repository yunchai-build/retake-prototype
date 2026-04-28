import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('[upload-frame] Blob error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
