/**
 * Voltrix Metric Formatters
 * Formats electrical power, energy, and financial values following Apple HIG clarity.
 */

export interface FormattedMetric {
  value: string;
  unit: string;
  full: string;
}

/**
 * Flexible Power Measurement:
 * - When active load is < 1,000 W (1 kW), displays in whole Watts (e.g. "45 W", "380 W").
 * - When active load is >= 1,000 W (1 kW), scales to kW (e.g. "1.25 kW", "3.4 kW").
 */
export function formatPower(activePowerKw: number | undefined | null): FormattedMetric {
  if (activePowerKw === undefined || activePowerKw === null || isNaN(activePowerKw) || activePowerKw <= 0) {
    return { value: '0', unit: 'W', full: '0 W' };
  }

  const watts = activePowerKw * 1000;

  if (watts < 1000) {
    const val = Math.round(watts).toString();
    return {
      value: val,
      unit: 'W',
      full: `${val} W`
    };
  }

  const val = activePowerKw >= 10 ? activePowerKw.toFixed(1) : activePowerKw.toFixed(2);
  return {
    value: val,
    unit: 'kW',
    full: `${val} kW`
  };
}

/**
 * Flexible Energy Measurement:
 * - When consumption is < 0.1 kWh, displays in Wh (e.g. "45 Wh", "85 Wh").
 * - Standard consumption displays in kWh (e.g. "4.2 kWh", "95.5 kWh").
 */
export function formatEnergy(kwh: number | undefined | null): FormattedMetric {
  if (kwh === undefined || kwh === null || isNaN(kwh) || kwh <= 0) {
    return { value: '0.0', unit: 'kWh', full: '0.0 kWh' };
  }

  if (kwh < 0.1) {
    const wh = Math.round(kwh * 1000).toString();
    return {
      value: wh,
      unit: 'Wh',
      full: `${wh} Wh`
    };
  }

  const val = kwh >= 100 ? kwh.toFixed(1) : kwh.toFixed(2);
  return {
    value: val,
    unit: 'kWh',
    full: `${val} kWh`
  };
}

/**
 * Legible Nigerian Naira currency formatting.
 */
export function formatCurrency(naira: number | undefined | null): string {
  if (naira === undefined || naira === null || isNaN(naira)) {
    return '₦0';
  }
  return `₦${Math.round(naira).toLocaleString()}`;
}
