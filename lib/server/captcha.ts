import { env } from "../env";
import { logWarn } from "./logger";

type VerifyCaptchaContext = {
  ip?: string | null;
  action?: string;
};

type VerifyCaptchaResult = {
  success: boolean;
  required: boolean;
  message?: string;
};

/**
 * Placeholder captcha verifier. When a supported provider and secret are configured
 * this should call the vendor API to validate the token. Until then we allow requests
 * to proceed while emitting structured logs so the integration can be completed
 * prior to production rollout.
 */
export async function verifyCaptchaToken(
  token: string | undefined,
  context: VerifyCaptchaContext = {}
): Promise<VerifyCaptchaResult> {
  const provider = env.CAPTCHA_PROVIDER;
  const secret = env.CAPTCHA_SECRET;

  if (!provider || !secret) {
    // Captcha not configured; treat as optional so local/dev flows continue.
    return {
      success: true,
      required: false,
      message: "captcha_disabled"
    };
  }

  if (!token) {
    return {
      success: false,
      required: true,
      message: "missing_token"
    };
  }

  logWarn("captcha_verification_stub", {
    provider,
    action: context.action,
    ip: context.ip,
    note: "Captcha verification not yet implemented on server"
  });

  // TODO: Integrate with the configured captcha provider's verification API.
  return {
    success: true,
    required: true,
    message: "verification_skipped_placeholder"
  };
}
