import { supabase } from './client';
import { WalletTransaction, RegisteredRecipient } from '../../types/meter';

// Fetch wallet transactions
export async function fetchSupabaseTransactions(meterId: string = 'MTR-8A24-19F2'): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('meter_id', meterId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as WalletTransaction[];
}

// Fetch registered cloud recipients
export async function fetchSupabaseRecipients(): Promise<RegisteredRecipient[]> {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .order('meter_name', { ascending: true });

  if (error) return [];
  return data as RegisteredRecipient[];
}

// Record Paystack transaction and credit meter balance in Supabase
export async function recordPaystackTransaction(
  meterId: string,
  amount: number,
  units: number,
  tokenNumber?: string
): Promise<{ success: boolean; newUnits?: number; newBalance?: number; error?: string }> {
  try {
    const txId = `TXN-PST-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        meter_id: meterId,
        id: txId,
        type: 'funding',
        title: 'Instant Recharge',
        description: `Smart Meter Direct Credit (+${units} kWh)`,
        amount_currency: amount,
        units_kwh: units,
        status: 'successful',
        token_number: tokenNumber || null,
        timestamp: 'Just now'
      });

    if (txError) {
      console.warn('[Supabase] Transaction insert notice:', txError.message);
    }

    const { data: meter } = await supabase
      .from('meters')
      .select('wallet_balance, prepaid_units_kwh')
      .eq('meter_id', meterId)
      .single();

    let newBal = amount;
    let newUnits = units;

    if (meter) {
      newBal = Number(meter.wallet_balance || 0) + amount;
      newUnits = Number((Number(meter.prepaid_units_kwh || 0) + units).toFixed(2));

      await supabase
        .from('meters')
        .update({
          wallet_balance: newBal,
          prepaid_units_kwh: newUnits,
          updated_at: new Date().toISOString()
        })
        .eq('meter_id', meterId);
    }

    return { success: true, newUnits, newBalance: newBal };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record Paystack funding' };
  }
}

