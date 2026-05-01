import { useState, useCallback } from 'react';

export function useSharePanel({ frameName, showToast, setScrimVisible }) {
  const [sharePanelVisible, setSharePanelVisible] = useState(false);
  const [shareCode, setShareCode] = useState('');

  const handleCopyLink = useCallback(() => {
    const code = 'RTKE-' + Math.floor(1000 + Math.random() * 9000);
    setShareCode(code);
    setSharePanelVisible(true);
    setScrimVisible(true);
  }, [setScrimVisible]);

  const handleCopyCode = useCallback(() => {
    const link = `https://retake.app/join/${shareCode}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast('Invite link copied!');
  }, [shareCode, showToast]);

  const handleShare = useCallback(async () => {
    const name = frameName || 'My frame';
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `Join my Retake frame: ${name}`, url: location.href });
      } catch(e) { /* cancelled */ }
    } else {
      showToast('Sharing not supported on this device');
    }
  }, [frameName, showToast]);

  return {
    sharePanelVisible, setSharePanelVisible,
    shareCode,
    handleCopyLink, handleCopyCode, handleShare,
  };
}
