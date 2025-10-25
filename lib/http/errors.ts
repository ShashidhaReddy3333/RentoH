import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function createErrorResponse(error: Error | HttpError, status = 500) {
  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.status : status;
  
  // Only expose error details in development
  const detail = process.env.NODE_ENV === "development" ? error.message : undefined;
  
  // Use friendly messages in production
  const message = getFriendlyErrorMessage(error, statusCode);

  return NextResponse.json(
    { 
      error: {
        message,
        code: isHttpError ? error.code : undefined,
        detail
      }
    },
    { status: statusCode }
  );
}

function getFriendlyErrorMessage(error: Error, status: number): string {
  // For security, normalize auth-related errors
  if (status === 401) {
    return "Authentication required";
  }
  if (status === 403) {
    return "You don't have permission to perform this action";
  }
  
  // Rate limiting
  if (status === 429) {
    return "Too many requests. Please try again later";
  }

  // CSRF
  if (error.message.includes("CSRF")) {
    return "Invalid request signature";
  }

  // Validation errors can be exposed
  if (status === 400 && error instanceof HttpError) {
    return error.message;
  }

  // Generic error for everything else
  return "Something went wrong. Please try again";
}