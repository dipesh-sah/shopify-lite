
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
};

export function successResponse<T>(data: T, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(message: string, status = 400, errors?: Record<string, string[]>) {
  const body: ApiResponse = {
    success: false,
    error: message,
    errors,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: any) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!formattedErrors[path]) formattedErrors[path] = [];
      formattedErrors[path].push(err.message);
    });
    return errorResponse('Validation failed', 422, formattedErrors);
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized' || error.message.includes('authen')) {
      return errorResponse('Unauthorized', 401);
    }
    return errorResponse(error.message, 500);
  }

  return errorResponse('Internal Server Error', 500);
}

export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (e) {
    throw new Error('Invalid JSON body');
  }
}
