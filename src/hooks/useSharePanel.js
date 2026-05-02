import { useState, useCallback } from 'react';

export function useSharePanel({ frameName, showToast, setScrimVisible, getFrameDataUrl }) {
  const [sharePanelVisible, setSharePanelVisible] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const buildInviteUrl = useCallback(async () => {
    if (!getFrameDataUrl) {
      return `${window.location.origin}/invitee`;
    }

    const frameDataUrl = await getFrameDataUrl();
    const res = await fetch('/api/upload-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameDataUrl, frameName }),
    });

    if (!res.ok) throw new Error('Frame upload failed');

    const { url } = await res.json();
    const inviteUrl = new URL('/invitee', window.location.origin);
    inviteUrl.searchParams.set('frame', url);
    inviteUrl.searchParams.set('name', frameName || 'my frame');
    return inviteUrl.toString();
  }, [frameName, getFrameDataUrl]);

  const handleCopyLink = useCallback(async () => {
    const code = 'RTKE-' + Math.floor(1000 + Math.random() * 9000);
    try {
      const url = await buildInviteUrl();
      setShareCode(code);
      setShareUrl(url);
      setSharePanelVisible(true);
      setScrimVisible(true);
      await navigator.clipboard?.writeText(url);
      showToast('Invite link copied!');
    } catch(e) {
      showToast('Could not create link');
    }
  }, [buildInviteUrl, setScrimVisible, showToast]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard?.writeText(shareUrl || window.location.href).catch(() => {});
    showToast('Invite link copied!');
  }, [shareUrl, showToast]);

  const handleShare = useCallback(async () => {
    const name = frameName || 'My frame';
    try {
      const url = shareUrl || await buildInviteUrl();
      setShareUrl(url);
      if (navigator.share) {
        await navigator.share({ title: name, text: `Step into my Retake frame: ${name}`, url });
      } else {
        await navigator.clipboard?.writeText(url);
        showToast('Invite link copied!');
      }
    } catch(e) {
      if (e.name !== 'AbortError') showToast('Could not share link');
    }
  }, [buildInviteUrl, frameName, shareUrl, showToast]);

  return {
    sharePanelVisible, setSharePanelVisible,
    shareCode, shareUrl,
    handleCopyLink, handleCopyCode, handleShare,
  };
}
