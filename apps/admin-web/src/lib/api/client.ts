import { ApiResponse, ApiErrorPayload } from './types';

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Array<{ field?: string; reason: string }>;
  requestId?: string;

  constructor(code: string, message: string, status: number, details?: Array<{ field?: string; reason: string }>, requestId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    }
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (err: any) {
    throw new ApiClientError(
      'NETWORK_ERROR',
      `Failed to connect to AgriNexis backend at ${baseUrl}: ${err?.message || 'Network unreachable'}`,
      0
    );
  }

  let body: any;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const errPayload = body as ApiErrorPayload;
    const errCode = errPayload?.error?.code || `HTTP_${response.status}`;
    const errMessage = errPayload?.error?.message || response.statusText || 'API request failed';
    const details = errPayload?.error?.details;
    const requestId = errPayload?.error?.request_id;

    throw new ApiClientError(errCode, errMessage, response.status, details, requestId);
  }

  return body as ApiResponse<T>;
}
