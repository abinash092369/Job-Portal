export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  error: any | null;
}

export function formatResponse<T = any>(
  success: boolean,
  data: T | null,
  message: string,
  error: any = null
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    error,
  };
}
