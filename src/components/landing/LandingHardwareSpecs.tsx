import React from 'react';
import { Cpu } from 'lucide-react';

export const LandingHardwareSpecs: React.FC = () => {
  return (
    <section id="hardware" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/[0.08]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-bold mb-3">
          <Cpu className="w-3.5 h-3.5 text-[#ff5b26]" />
          <span>PCB Schematic Pinout Reference</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Verified Hardware Mapping
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Exact hardware GPIO assignments verified on the physical Voltrix PCB board.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GPIO 13 */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-black text-[#ff5b26] mb-1">
            <span>GPIO 13</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">OUTPUT</span>
          </div>
          <div className="text-sm font-bold text-white">Mains Contactor Relay</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active-LOW optocoupler trigger. LOW = Closed (Power ON), HIGH = Open (Power Cut).
          </div>
        </div>

        {/* GPIO 16 / 17 */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-black text-cyan-400 mb-1">
            <span>GPIO 16 / 17</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">UART2</span>
          </div>
          <div className="text-sm font-bold text-white">PZEM-004T v3.0</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pin 16 (RX2), Pin 17 (TX2). 9600 baud Modbus RTU telemetry over optical isolators.
          </div>
        </div>

        {/* GPIO 32 */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-black text-red-400 mb-1">
            <span>GPIO 32</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">INPUT_PULLUP</span>
          </div>
          <div className="text-sm font-bold text-white">Enclosure Tamper Switch</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sub-millisecond enclosure breach detection. Triggers 2.7kHz alarm and NVS lockout.
          </div>
        </div>

        {/* GPIO 27 */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-black text-amber-400 mb-1">
            <span>GPIO 27</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">OUTPUT</span>
          </div>
          <div className="text-sm font-bold text-white">Wi-Fi Status Strobe LED</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Solid ON when connected to cloud. Rapid 200ms warning blink when running in offline queue mode.
          </div>
        </div>
      </div>
    </section>
  );
};
