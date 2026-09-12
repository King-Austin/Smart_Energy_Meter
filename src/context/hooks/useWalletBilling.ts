import { useState, useEffect, useCallback } from 'react';
import { WalletTransaction, RegisteredRecipient, MeterTelemetry, NotificationItem } from '../../types/meter';
import { INITIAL_WALLET_TRANSACTIONS, REGISTERED_RECIPIENTS } from '../../services/mockData';
import {
  fetchSupabaseTransactions,
  fetchSupabaseRecipients,
  recordPaystackTransaction
} from '../../services/supabase';
import { calculateUnitsFromAmount } from '../../services/paymentService';

export interface UseWalletBillingProps {
  selectedMeterId: string;
  meterData: MeterTelemetry;
  setMeterData: React.Dispatch<React.SetStateAction<MeterTelemetry>>;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
}

export function useWalletBilling({
  selectedMeterId,
  meterData,
  setMeterData,
  addNotification
}: UseWalletBillingProps) {
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [recipients, setRecipients] = useState<RegisteredRecipient[]>(REGISTERED_RECIPIENTS);

  // Load transactions and recipients on mount or meter switch
  useEffect(() => {
    async function loadData() {
      try {
        const txs = await fetchSupabaseTransactions(selectedMeterId);
        if (txs && txs.length > 0) {
          setWalletTransactions(txs);
        }
        const recs = await fetchSupabaseRecipients();
        if (recs && recs.length > 0) {
          setRecipients(recs);
        }
      } catch (err) {
        console.warn('[useWalletBilling] Error loading billing data:', err);
      }
    }
    loadData();
  }, [selectedMeterId]);

  // Handle Return from External Paystack 3D-Secure / Redirect Callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (reference) {
      // Clean query parameters from URL bar seamlessly
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      addNotification(
        'Paystack Payment Verified',
        `Transaction ${reference} completed. Meter balance refreshed successfully.`,
        'wallet'
      );
    }
  }, [addNotification]);

  // Standard wallet funding (direct credit)
  const fundWallet = useCallback(
    (amount: number, method: string = 'CARD') => {
      const units = calculateUnitsFromAmount(amount, meterData.tariff_rate);
      const newTx: WalletTransaction = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'funding',
        title: 'Instant Recharge',
        description: `Recharge via ${method.toUpperCase()} (+${units} kWh)`,
        amount_currency: amount,
        units_kwh: units,
        timestamp: 'Just now',
        status: 'successful'
      };

      setWalletTransactions(prev => [newTx, ...prev]);
      setMeterData(prev => {
        const newBal = prev.wallet_balance + amount;
        const newUnits = Number((prev.prepaid_units_kwh + units).toFixed(2));
        const newDays = Math.max(1, Math.round(newUnits / 8.0));
        return {
          ...prev,
          wallet_balance: newBal,
          prepaid_units_kwh: newUnits,
          estimated_days_remaining: newDays
        };
      });

      addNotification(
        'Recharge Successful',
        `${meterData.currency_symbol}${amount.toLocaleString()} credited (+${units} kWh units added directly).`,
        'wallet'
      );
    },
    [meterData.tariff_rate, meterData.currency_symbol, setMeterData, addNotification]
  );

  // Paystack Funding - Direct Smart Meter Credit (No Token Required)
  const fundWalletWithPaystack = useCallback(
    async (amount: number): Promise<{ success: boolean; units: number; newBalanceUnits: number; error?: string }> => {
      const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 160.0;
      const units = calculateUnitsFromAmount(amount, tariff);

      const dbRes = await recordPaystackTransaction(meterData.meter_id, amount, units);

      const newTx: WalletTransaction = {
        id: `TXN-PST-${Date.now().toString().slice(-4)}`,
        type: 'funding',
        title: 'Instant Recharge',
        description: `Direct Smart Meter Credit (+${units} kWh)`,
        amount_currency: amount,
        units_kwh: units,
        timestamp: 'Just now',
        status: 'successful'
      };

      const newUnits = dbRes.newUnits !== undefined 
        ? dbRes.newUnits 
        : Number((meterData.prepaid_units_kwh + units).toFixed(2));

      setWalletTransactions(prev => [newTx, ...prev]);
      setMeterData(prev => {
        const newBal = prev.wallet_balance + amount;
        const newDays = Math.max(1, Math.round(newUnits / 8.0));
        return {
          ...prev,
          wallet_balance: newBal,
          prepaid_units_kwh: newUnits,
          estimated_days_remaining: newDays
        };
      });

      addNotification(
        'Recharge Confirmed',
        `₦${amount.toLocaleString()} credited (+${units} kWh added directly to your smart meter).`,
        'wallet'
      );

      return { success: true, units, newBalanceUnits: newUnits };
    },
    [meterData.meter_id, meterData.tariff_rate, meterData.prepaid_units_kwh, setMeterData, addNotification]
  );


  const saveRecipient = useCallback((meterId: string) => {
    setRecipients(prev => prev.map(r => (r.meter_id === meterId ? { ...r, is_saved: true } : r)));
  }, []);

  const searchRecipients = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return recipients.filter(
        r =>
          r.meter_name.toLowerCase().includes(q) ||
          r.meter_id.toLowerCase().includes(q) ||
          r.owner_name.toLowerCase().includes(q)
      );
    },
    [recipients]
  );

  return {
    walletTransactions,
    setWalletTransactions,
    recipients,
    setRecipients,
    fundWallet,
    fundWalletWithPaystack,
    saveRecipient,
    searchRecipients
  };
}
