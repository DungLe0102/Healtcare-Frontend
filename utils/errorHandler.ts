export const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại'): string => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ') || defaultMsg;
  }
  return defaultMsg;
};
