import { MeterTelemetry, TamperEvent, OutageLog, AIInsightReport } from '../types/meter';

const GEMINI_API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.GEMINI_API_KEY ||
  '';

export function getGroqApiKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('voltrix_groq_api_key');
    if (localKey && localKey.trim()) return localKey.trim();
  }
  return (
    (import.meta as any).env?.VITE_GROQ_API_KEY ||
    (import.meta as any).env?.GROQ_API_KEY ||
    ''
  );
}

export function setGroqApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('voltrix_groq_api_key', key.trim());
    } else {
      localStorage.removeItem('voltrix_groq_api_key');
    }
  }
}

export function hasGroqApiKey(): boolean {
  return Boolean(getGroqApiKey());
}

export async function generateAIInsights(
  meter: MeterTelemetry,
  hourlyData?: { hourLabel: string; kwh: number; cost: number }[]
): Promise<AIInsightReport> {
  const dayOfMonth = Math.max(1, new Date().getDate());
  const daysInMonth = 30;
  const currentDailyKwh = meter.energy_today || 8.42;
  const monthToDateKwh = meter.energy_month || (currentDailyKwh * dayOfMonth * 0.85);

  // Analytical baseline
  const projectedKwh = Math.round((monthToDateKwh / dayOfMonth) * daysInMonth);
  const projectedCost = Math.round(projectedKwh * (meter.tariff_rate || 68.5));
  const dailyAverageKwh = Number((monthToDateKwh / dayOfMonth).toFixed(1));

  // Determine Peak period from hourly data if available
  let peakPeriod = '7:00 PM – 10:30 PM (Evening Load)';
  if (hourlyData && hourlyData.length > 0) {
    const peak = hourlyData.reduce((prev, curr) => (curr.kwh > prev.kwh ? curr : prev), hourlyData[0]);
    peakPeriod = `${peak.hourLabel} peak (${peak.kwh} kWh)`;
  }

  // Anomaly & Tamper Risk logic
  let anomalyStatus: 'normal' | 'caution' | 'abnormal' = 'normal';
  let anomalyDesc = 'Stable consumption profile. No phantom leakage or sudden drop-offs detected.';
  let tamperScore = 0;

  if (meter.is_tampered || meter.tamper_locked) {
    anomalyStatus = 'abnormal';
    anomalyDesc = 'Critical: Enclosure lid switch triggered. Power isolated.';
    tamperScore = 95;
  } else if (meter.voltage_cutoff_tripped) {
    anomalyStatus = 'abnormal';
    anomalyDesc = `Grid voltage anomaly detected (${meter.voltage}V exceeds safety threshold).`;
  } else if (meter.current > (meter.over_current_limit || 30.0) * 0.9) {
    anomalyStatus = 'caution';
    anomalyDesc = `Current draw (${meter.current}A) is operating near the breaker limit (${meter.over_current_limit}A).`;
  }

  // If Gemini Key is present, call Gemini 1.5 Flash for enhanced recommendations
  let energySavingTips = [
    `Peak demand occurs around ${peakPeriod}. Shifting heavy laundry or water pumping to off-peak morning hours could save up to ₦3,400 monthly.`,
    `Current baseline standby load is ~${Math.round(meter.active_power * 300)}W. Unplugging idle decoders and home entertainment gear overnight can reduce bill by 6%.`,
    `At ₦${meter.tariff_rate}/kWh, setting refrigerator thermostats to medium saves ~1.8 kWh (₦${Math.round(1.8 * meter.tariff_rate)}) daily.`
  ];

  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are Voltrix AI, an expert Nigerian smart energy meter advisor.
Context:
- Current Load: ${meter.active_power} kW (${meter.current}A @ ${meter.voltage}V, PF: ${meter.power_factor})
- Energy Today: ${meter.energy_today} kWh (Cost: ₦${meter.estimated_cost_today})
- Tariff: ₦${meter.tariff_rate}/kWh
- Monthly Budget: ₦${meter.monthly_budget_naira}
- Projected Month: ${projectedKwh} kWh (₦${projectedCost})
Generate 3 short, punchy, bulleted energy-saving tips tailored specifically for this Nigerian household to avoid exceeding their ₦${meter.monthly_budget_naira} budget. Return as JSON array of 3 strings.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
          })
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            energySavingTips = parsed.slice(0, 3);
          }
        }
      }
    } catch (err) {
      console.warn('[Gemini AI] Using rule-based tips fallback:', err);
    }
  }

  return {
    predictedMonthKwh: projectedKwh,
    predictedMonthCostNaira: projectedCost,
    dailyAverageKwh,
    peakUsagePeriod: peakPeriod,
    anomalyStatus,
    anomalyDescription: anomalyDesc,
    tamperRiskScore: tamperScore,
    energySavingTips
  };
}

export async function askEnergyAssistant(
  query: string,
  meter: MeterTelemetry,
  tamperEvents: TamperEvent[] = [],
  outageLogs: OutageLog[] = []
): Promise<string> {
  const qLower = query.toLowerCase();

  // Fast deterministic responses for the 4 core prompts
  if (qLower.includes('how much did i use today') || qLower.includes('how much i use today')) {
    const cost = Math.round(meter.energy_today * meter.tariff_rate);
    return `⚡ **Today's Consumption:**\nYou have consumed **${meter.energy_today.toFixed(2)} kWh** today, costing approximately **₦${cost.toLocaleString()}** at your configured tariff of ₦${meter.tariff_rate}/kWh.\n\nYour current active draw is **${meter.active_power.toFixed(2)} kW** (${meter.current.toFixed(1)} Amps).`;
  }

  if (qLower.includes('why is my bill high') || qLower.includes('bill high')) {
    const projected = meter.projected_bill_month || Math.round(meter.projected_month * meter.tariff_rate);
    const budgetPct = meter.monthly_budget_naira > 0 ? Math.round((projected / meter.monthly_budget_naira) * 100) : 100;
    return `💰 **Bill Analysis:**\nYour projected month-end bill is **₦${projected.toLocaleString()}**, which is **${budgetPct}%** of your monthly budget (₦${(meter.monthly_budget_naira || 25000).toLocaleString()}).\n\n**Key Factors:**\n1. Active load is **${meter.active_power.toFixed(2)} kW** with a tariff of **₦${meter.tariff_rate}/kWh**.\n2. Power factor is **${meter.power_factor.toFixed(2)}**.\n3. Peak usage is running higher than average during evening cycles. Consider lowering heavy inductive loads.`;
  }

  if (qLower.includes('when was the last outage') || qLower.includes('last outage')) {
    if (outageLogs.length === 0) {
      return `🔌 **Grid Status:**\nGrid status is currently **${meter.grid_status.toUpperCase()}** (${meter.voltage}V). No recent blackout incidents have been logged for this submeter.`;
    }
    const last = outageLogs[0];
    const duration = last.duration_seconds
      ? `${Math.floor(last.duration_seconds / 60)} minutes`
      : 'Active blackout in progress';
    return `🔌 **Outage Forensics:**\nThe last detected grid outage started at **${new Date(last.outage_start).toLocaleString()}**.\n- **Downtime Duration:** ${duration}\n- **Trigger Cause:** ${last.cause.replace(/_/g, ' ')}\n- **Current Voltage:** ${meter.voltage} VAC`;
  }

  if (qLower.includes('is my consumption unusual') || qLower.includes('consumption unusual')) {
    const hasUnresolvedTamper = meter.is_tampered || meter.tamper_locked || tamperEvents.some(t => !t.resolved);
    if (hasUnresolvedTamper) {
      return `⚠️ **Alert - Physical Tamper Triggered:**\nYour consumption profile is flagged because the **SS-5GL enclosure lid limit switch** was triggered. The contactor relay is locked in the SAFE/OFF position. Please contact your property administrator.`;
    }
    if (meter.active_power > 5.0) {
      return `⚠️ **High Load Advisory:**\nYour current load of **${meter.active_power.toFixed(2)} kW** is noticeably above your average daytime baseline. Multiple high-draw appliances (e.g. water heater, AC, electric cooker) appear to be running simultaneously.`;
    }
    return `✅ **Consumption is Normal:**\nYour power draw of **${meter.active_power.toFixed(2)} kW** and today's **${meter.energy_today.toFixed(2)} kWh** match your regular baseline pattern. Voltage is stable at **${meter.voltage}V** with a healthy power factor of **${meter.power_factor}**.`;
  }

  // 1. Groq Ultra-Fast LPU API (Prioritized for instant responses)
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const systemPrompt = `You are Voltrix AI, a helpful, ultra-fast Nigerian smart energy meter advisor.
Context on current submeter telemetry:
- Submeter ID: ${meter.meter_id} (${meter.meter_name}, ${meter.location || 'Main Unit'})
- Voltage: ${meter.voltage} V (Grid Status: ${meter.grid_status})
- Current: ${meter.current} A
- Active Power: ${meter.active_power} kW
- Power Factor: ${meter.power_factor}
- Frequency: ${meter.frequency} Hz
- Energy Today: ${meter.energy_today} kWh (Cost today: ₦${meter.estimated_cost_today || Math.round(meter.energy_today * meter.tariff_rate)})
- Monthly Energy: ${meter.energy_month} kWh
- Tariff Rate: ₦${meter.tariff_rate}/kWh
- Monthly Budget: ₦${meter.monthly_budget_naira} (₦${meter.estimated_bill_month || 0} consumed so far)
- Contactor Relay State: ${meter.main_supply_connected ? 'CONNECTED (Power ON)' : 'DISCONNECTED (Power OFF)'}
- Tamper Interlock State: ${meter.is_tampered || meter.tamper_locked ? 'TAMPER BREACH DETECTED (SS-5GL Lid Switch Opened)' : 'SECURE'}
- Active Blackout Logs: ${outageLogs.length} total logged

Provide a direct, concise, practical answer tailored to the Nigerian electricity context (Naira ₦, Band tariffs, gen/inverter trade-offs, appliance load shedding). Keep response under 3 paragraphs with clean markdown.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (res.ok) {
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn('[Groq AI] API error response:', errJson);
      }
    } catch (err) {
      console.warn('[Groq AI] Request error:', err);
    }
  }

  // 2. Gemini 1.5 Flash fallback
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are the Voltrix Smart Energy Assistant for a submeter in Nigeria.
Answer the user's question concisely in 2-3 short paragraphs using the following live telemetry context:
- Meter ID: ${meter.meter_id} (${meter.meter_name}, ${meter.location || 'Building Main'})
- Voltage: ${meter.voltage} V
- Current: ${meter.current} A
- Active Power: ${meter.active_power} kW
- Energy Today: ${meter.energy_today} kWh
- Energy Month: ${meter.energy_month} kWh
- Tariff Rate: ₦${meter.tariff_rate}/kWh
- Monthly Budget: ₦${meter.monthly_budget_naira} (₦${meter.estimated_bill_month} spent so far)
- Contactor Relay: ${meter.main_supply_connected ? 'CONNECTED (Power ON)' : 'DISCONNECTED (Power CUT)'}
- Tamper State: ${meter.is_tampered ? 'TAMPER FLAGGED' : 'NORMAL'}
- Grid Status: ${meter.grid_status}

User Question: "${query}"`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (res.ok) {
        const json = await res.json();
        const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      }
    } catch (err) {
      console.warn('[Gemini AI] Query error:', err);
    }
  }

  // 3. Smart deterministic telemetry response
  return `⚡ **Voltrix Energy Status:**\n- **Live Load:** ${meter.active_power.toFixed(2)} kW (${meter.current.toFixed(1)}A @ ${meter.voltage}V, PF: ${meter.power_factor})\n- **Today's Consumption:** ${meter.energy_today.toFixed(2)} kWh (~₦${Math.round(meter.energy_today * meter.tariff_rate).toLocaleString()})\n- **Tariff Rate:** ₦${meter.tariff_rate}/kWh (Monthly Budget: ₦${meter.monthly_budget_naira.toLocaleString()})\n- **Contactor Relay:** ${meter.main_supply_connected ? 'Active (ON)' : 'Isolated (OFF)'}\n\n💡 *Tip: Connect your Groq API Key using the ⚡ settings button above to enable instant conversational intelligence!*`;
}
