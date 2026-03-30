const AUTH_FLASH_KEY = 'auth_flash_message';

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

export function setAuthFlashMessage(message: string, storage?: StorageLike | null) {
  const target = getStorage(storage);
  if (!target) return;
  target.setItem(AUTH_FLASH_KEY, message);
}

export function consumeAuthFlashMessage(storage?: StorageLike | null) {
  const target = getStorage(storage);
  if (!target) return null;
  const message = target.getItem(AUTH_FLASH_KEY);
  if (!message) return null;
  target.removeItem(AUTH_FLASH_KEY);
  return message;
}
