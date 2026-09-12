import React, { useState, useEffect, useRef } from 'react';
import { useMeter } from '../../context/MeterContext';
import { fetchTelemetryLogs, subscribeToTelemetryLogs } from '../../services/supabase';
import {
  Wifi,
  Terminal,
  ExternalLink,
  RefreshCw,
  Zap,
  HelpCircle,
  Radio,
  ArrowUpRight,
  Globe,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const WirelessConsoleCard: React.FC = () => {
  const { meterData } = useMeter();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [espIp, setEspIp] = useState<string>(() => {
    return localStorage.getItem('voltrix_esp32_ip') || '10.28.133.209';
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Save IP to localStorage on change
  const handleIpChange = (newIp: string) => {
    setEspIp(newIp);
    localStorage.setItem('voltrix_esp32_ip', newIp);
  };

  // Test local Wi-Fi connectivity to ESP32
  const testLocalConnection = async (target: 'ip' | 'mdns') => {
    setTestStatus('testing');
    const url = target === 'mdns' ? 'http://voltrix-meter.local/api/status' : `http://${espIp}/api/status`;
    setTestMessage(`Testing connection to ${url}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal, mode: 'cors' });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`Connected directly! ESP32 online on LAN (${data.voltage || 0}V, relay: ${data.relay ? 'ON' : 'OFF'}).`);
      } else {
        setTestStatus('failed');
        setTestMessage(`Server reached but returned HTTP ${res.status}.`);
      }
    } catch {
      setTestStatus('failed');
      if (target === 'mdns') {
        setTestMessage(
          'Could not resolve "voltrix-meter.local". Note: Android Chrome & some routers block .local mDNS queries. Please test the direct IP address instead.'
        );
      } else {
        setTestMessage(
          `Could not connect to ${espIp}. Make sure your phone/PC and ESP32 are on the exact same Wi-Fi network ('testmode'), or check the IP on the meter's LCD display.`
        );
      }
    }
  };

  // 1. Initial Load of recent telemetry logs
  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchTelemetryLogs(meterData.meter_id, 25);
    setLogs(data.reverse()); // Chronological order
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();

    // 2. Real-time Subscription to new telemetry logs arriving from ESP32
    const channel = subscribeToTelemetryLogs(meterData.meter_id, (newLog) => {
      setLogs((prev) => [...prev.slice(-40), newLog]); // Keep last 40 lines
    });

    return () => {
      channel.unsubscribe();
    };
  }, [meterData.meter_id]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="glass-card p-5 space-y-4 border-slate-200/80 dark:border-neutral-800/80">
      {/* Card Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26] border border-[#ff5b26]/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Wireless Console & Over-The-Air (OTA)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Wi-Fi Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live wireless telemetry stream & direct browser OTA firmware flashing
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs font-bold text-[#ff5b26] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showGuide ? 'Hide Wi-Fi Guide' : 'Wi-Fi & Connection Troubleshooting'}</span>
        </button>
      </div>

      {/* Troubleshooting Accordion */}
      {showGuide && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-neutral-800/70 border border-slate-200 dark:border-neutral-700 text-xs text-slate-700 dark:text-slate-300 space-y-2.5 animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-[#ff5b26]">
            <span>📶 Why voltrix-meter.local or Wi-Fi Direct may not open:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-neutral-300">
            <li>
              <strong>Android Chrome does not support .local mDNS names</strong>: If you are testing on an Android phone, Chrome will not resolve <code className="text-[#ff5b26]">http://voltrix-meter.local/</code>. Use the <strong>ESP32 Direct IP</strong> instead (shown on the LCD screen at boot, e.g. <code className="text-[#ff5b26]">http://10.28.133.209/</code>).
            </li>
            <li>
              <strong>Same Wi-Fi Network Required</strong>: Your phone/computer must be connected to the exact same Wi-Fi router / mobile hotspot as the ESP32 (SSID: <code className="text-[#ff5b26]">testmode</code>).
            </li>
            <li>
              <strong>Router Client Isolation</strong>: Some enterprise/public Wi-Fi networks block device-to-device communication on the LAN. In this case, the <strong>Cloud Sync (Supabase)</strong> monitor below continues to work seamlessly anywhere in the world!
            </li>
          </ol>
        </div>
      )}

      {/* Dual Direct Browser Portal Links */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Local ESP32 IP:</span>
            <input
              type="text"
              value={espIp}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="10.28.133.209"
              className="w-32 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26]"
            />
            <span className="text-[10px] text-slate-500">(from LCD screen)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => testLocalConnection('ip')}
              disabled={testStatus === 'testing'}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-all cursor-pointer"
            >
              Test IP Ping
            </button>
            <button
              onClick={() => testLocalConnection('mdns')}
              disabled={testStatus === 'testing'}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-all cursor-pointer"
            >
              Test .local Ping
            </button>
          </div>
        </div>

        {/* Test Result Feedback Pill */}
        {testStatus !== 'idle' && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              testStatus === 'testing'
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-300'
                : testStatus === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300'
            }`}
          >
            {testStatus === 'testing' && <RefreshCw className="w-3.5 h-3.5 animate-spin mt-0.5 shrink-0" />}
            {testStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            {testStatus === 'failed' && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            <span className="text-[11px] leading-relaxed">{testMessage}</span>
          </div>
        )}

        {/* Fast Browser Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <a
            href={`http://${espIp}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#ff5b26]/10 text-[#ff5b26] hover:bg-[#ff5b26]/20 border border-[#ff5b26]/25 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open via IP ({espIp})</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>

          <a
            href="http://voltrix-meter.local/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/25 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open voltrix-meter.local</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>

          <a
            href={`http://${espIp}/update`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Web OTA Update</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Cloud-Synced Wireless Telemetry Console Window */}
      <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-[#020617] text-slate-200 overflow-hidden shadow-inner">
        {/* Terminal Top Control Bar */}
        <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-slate-300">Live Hardware Stream (Cloud Sync)</span>
            <span className="text-[10px] text-slate-500 font-mono">2s Cycle</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded text-[#ff5b26] focus:ring-0"
              />
              <span>Auto-scroll</span>
            </label>

            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Console Output Area */}
        <div className="p-3 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-1 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-500 py-6 text-center italic">
              Awaiting telemetry packets from ESP32 prototype...
            </div>
          ) : (
            logs.map((l, i) => {
              const time = l.created_at ? new Date(l.created_at).toLocaleTimeString() : '--:--:--';
              const v = Number(l.voltage || 0).toFixed(1);
              const cur = Number(l.current || 0).toFixed(2);
              const p = Number(l.active_power || 0).toFixed(2);
              const pf = Number(l.power_factor || 0).toFixed(2);
              const freq = Number(l.frequency || 0).toFixed(1);
              const isRelayOn = l.is_relay_on !== false;
              const isTamper = l.is_tampered === true;

              return (
                <div key={l.id || i} className="flex items-baseline gap-2 py-0.5 border-b border-slate-800/40 hover:bg-slate-900/40 px-1 rounded">
                  <span className="text-slate-500 shrink-0">[{time}]</span>
                  <span className="text-[#38bdf8] font-bold shrink-0">PZEM</span>
                  <span className="text-amber-300 font-semibold">{v}V</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-400 font-semibold">{cur}A</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-sky-300 font-semibold">{p}kW</span>
                  <span className="text-slate-500 text-[10px]">PF {pf} · {freq}Hz</span>
                  <span className="text-slate-600">|</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${isRelayOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    D13: {isRelayOn ? 'ON' : 'CUT'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${!isTamper ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                    Tamper: {isTamper ? 'BREACH' : 'SECURE'}
                  </span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
