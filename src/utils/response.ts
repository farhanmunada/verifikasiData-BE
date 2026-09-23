import { Context } from 'hono';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export const successResponse = <T>(
  c: Context,
  message: string,
  data?: T,
  statusCode: 200 | 201 = 200
) => {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
    },
    statusCode
  );
};

export const errorResponse = (
  c: Context,
  message: string,
  code: string = 'BAD_REQUEST',
  details?: any,
  statusCode: 400 | 401 | 403 | 404 | 422 | 500 = 400
) => {
  return c.json<ApiResponse>(
    {
      success: false,
      message,
      error: {
        code,
        ...(details ? { details } : {}),
      },
    },
    statusCode
  );
};
