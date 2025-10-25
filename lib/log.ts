import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "auth",
  "credentials",
  "supabase",
  "cookie",
  "session",
  "jwt",
];

const URL_PATTERN = /https?:\/\/[^\s<>]*/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Redacts sensitive information from log data
 */
function scrub(data: unknown): unknown {
  if (typeof data === "string") {
    // Redact URLs except for specific allowed domains
    let scrubbed = data.replace(URL_PATTERN, (url) => {
      if (url.includes("localhost") || (env.NEXT_PUBLIC_SITE_URL && url.includes(env.NEXT_PUBLIC_SITE_URL))) {
        return url;
      }
      return "[REDACTED_URL]";
    });

    // Redact emails
    scrubbed = scrubbed.replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
    
    // Redact UUIDs
    scrubbed = scrubbed.replace(UUID_PATTERN, "[REDACTED_ID]");
    
    return scrubbed;
  }

  if (Array.isArray(data)) {
    return data.map(scrub);
  }

  if (data && typeof data === "object") {
    const scrubbedObj: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Redact sensitive keys
      if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
        scrubbedObj[key] = "[REDACTED]";
      } else {
        scrubbedObj[key] = scrub(value);
      }
    }
    
    return scrubbedObj;
  }

  return data;
}

/**
 * Structured logging with sensitive data scrubbing
 */
function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const scrubbedContext = context ? scrub(context) : undefined;
  
  const logData = {
    timestamp,
    level,
    message: scrub(message),
    ...(scrubbedContext as object)
  };

  if (env.NODE_ENV === "development") {
    // Pretty print in development
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, scrubbedContext);
  } else {
    // JSON format in production for log aggregation
    console[level](JSON.stringify(logData));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context)
};