import { useBeforeUnload } from 'react-router-dom';

export function useUnsavedChangesWarning(isDirty: boolean, message = '当前有未保存内容，确认离开吗？') {
  useBeforeUnload((event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = message;
  });
}
