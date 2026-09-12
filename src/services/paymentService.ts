/**
 * Payment & Paystack Integration Service
 * Encapsulates Paystack inline script injection and STS token generation.
 */

export interface PaymentResult {
  success: boolean;
  units: number;
  amount: number;
  error?: string;
}

// Calculate kWh units directly from payment amount given a tariff rate (e.g. ₦5000 / ₦160 = 31.25 kWh)
export function calculateUnitsFromAmount(amount: number, tariffRate: number = 160.0): number {
  const rate = tariffRate > 0 ? tariffRate : 160.0;
  return Number((amount / rate).toFixed(2));
}


// Load Paystack Inline JS script dynamically
export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[PaymentService] Failed to load Paystack inline script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
