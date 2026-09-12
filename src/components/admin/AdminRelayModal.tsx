import React from 'react';
import { Power } from 'lucide-react';
import { MeterSummary } from '../../types/meter';
import { PinAuthModal } from '../common/PinAuthModal';

export interface AdminRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: MeterSummary | null;
  targetState: boolean;
  onConfirm: (meterId: string, state: boolean, pin: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminRelayModal: React.FC<AdminRelayModalProps> = ({
  isOpen,
  onClose,
  meter,
  targetState,
  onConfirm
}) => {
  if (!meter) return null;

  return (
    <PinAuthModal
      isOpen={isOpen}
      onClose={onClose}
      title={targetState ? 'Connect Contactor Relay' : 'Cut Supply Contactor'}
      subtitle={`${meter.meter_name} (${meter.meter_id})`}
      description={
        targetState
          ? 'This will restore high-voltage 230V AC mains to the client sub-panel.'
          : 'This will physically trip the 30A contactor relay and disconnect client electrical supply.'
      }
      icon={<Power className="w-6 h-6" />}
      iconBgClass={targetState ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}
      actionButtonText={targetState ? 'Restore Supply' : 'Disconnect Supply'}
      actionButtonClass={targetState ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
      onAuthorize={async (pin) => {
        const res = await onConfirm(meter.meter_id, targetState, pin);
        if (!res.success) {
          throw new Error(res.error || 'Failed to toggle relay');
        }
      }}
    />
  );
};
