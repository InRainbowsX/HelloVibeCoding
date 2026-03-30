const CONTENT_FLASH_KEY = 'content_flash_message';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(storage?: StorageLike | null) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function setContentFlashMessage(message: string, storage?: StorageLike | null) {
  const target = getStorage(storage);
  if (!target) return;
  target.setItem(CONTENT_FLASH_KEY, message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('content-flash', { detail: message }));
  }
}

export function consumeContentFlashMessage(storage?: StorageLike | null) {
  const target = getStorage(storage);
  if (!target) return null;
  const message = target.getItem(CONTENT_FLASH_KEY);
  if (!message) return null;
  target.removeItem(CONTENT_FLASH_KEY);
  return message;
}
