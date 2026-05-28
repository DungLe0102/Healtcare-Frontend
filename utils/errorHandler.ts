export const getErrorMessage = (error: any, defaultMsg = 'Thao tác thất bại'): string => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => (typeof e === 'object' && e ? e.msg || JSON.stringify(e) : String(e))).join(', ') || defaultMsg;
  }
  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return error?.message || defaultMsg;
};
