import type { AuthResponse } from './auth-api';

export function runLoginSuccessFlow(
  data: AuthResponse,
  options: {
    syncAuthState: (data: AuthResponse) => void;
    onLogin?: (data: AuthResponse) => void;
  },
) {
  options.syncAuthState(data);
  options.onLogin?.(data);
}
