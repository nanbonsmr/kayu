/**
 * Dodo Payments Service
 *
 * Product: Kayu Pro Monthly — $5.99/month
 * Product ID: pdt_0Ndsn5qjEaQSjPRxM3Ldq
 *
 * Redirect strategy:
 *   We use HTTPS redirect URLs (not kayu://) because Android WebView
 *   blocks custom-scheme redirects. We use a unique path that we detect
 *   in the WebView navigation handler.
 *
 *   Success: https://kayu.app/payment/success
 *   Cancel:  https://kayu.app/payment/cancel
 *
 *   The WebView intercepts these before they load (they don't need to
 *   actually exist as real pages — we catch them in onShouldStartLoadWithRequest).
 *
 *   We ALSO listen for the kayu:// deep link in _layout.tsx as a fallback
 *   for when the payment completes in an external browser.
 */

export const DODO_PRODUCT_ID    = 'pdt_0Ndsn5qjEaQSjPRxM3Ldq';
export const DODO_CHECKOUT_BASE = 'https://checkout.dodopayments.com/buy';

// HTTPS redirect URLs — intercepted by WebView before loading
export const DODO_SUCCESS_HTTPS = 'https://kayu.app/payment/success';
export const DODO_CANCEL_HTTPS  = 'https://kayu.app/payment/cancel';

// Deep-link fallback (for external browser flow)
export const DODO_SUCCESS_DEEP = 'kayu://payment/success';
export const DODO_CANCEL_DEEP  = 'kayu://payment/cancel';

export const PLAN_PRICE    = '$5.99';
export const PLAN_PERIOD   = '/month';
export const PLAN_LABEL    = 'Kayu Pro';
export const PLAN_INTERVAL = 'Monthly';

/**
 * Build the Dodo checkout URL.
 * Uses HTTPS redirect URLs so Android WebView handles them correctly.
 */
export function buildCheckoutUrl(email?: string): string {
  const params = new URLSearchParams({
    redirect_url: DODO_SUCCESS_HTTPS,
    cancel_url:   DODO_CANCEL_HTTPS,
    quantity:     '1',
  });
  if (email) params.set('customer_email', email);
  return `${DODO_CHECKOUT_BASE}/${DODO_PRODUCT_ID}?${params.toString()}`;
}

/**
 * Detect whether a URL is a Dodo payment result.
 * Checks both HTTPS intercept URLs and kayu:// deep links.
 */
export function detectPaymentResult(url: string): 'success' | 'cancel' | null {
  const lower = url.toLowerCase();

  // Success patterns
  if (
    lower.startsWith('https://kayu.app/payment/success') ||
    lower.startsWith('kayu://payment/success')           ||
    lower.includes('/payment/success')                   ||
    lower.includes('payment_status=paid')                ||
    lower.includes('payment_status=success')             ||
    lower.includes('status=success')
  ) return 'success';

  // Cancel patterns
  if (
    lower.startsWith('https://kayu.app/payment/cancel') ||
    lower.startsWith('kayu://payment/cancel')           ||
    lower.includes('/payment/cancel')                   ||
    lower.includes('payment_status=cancel')             ||
    lower.includes('status=cancel')
  ) return 'cancel';

  return null;
}

/** 31-day expiry from now */
export function calcExpiresAt(): number {
  return Date.now() + 31 * 24 * 60 * 60 * 1000;
}
