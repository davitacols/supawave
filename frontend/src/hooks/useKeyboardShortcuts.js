import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key.toLowerCase();
    const shortcut = shortcuts[key];
    
    if (shortcut) {
      event.preventDefault();
      shortcut();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};

export default useKeyboardShortcuts;