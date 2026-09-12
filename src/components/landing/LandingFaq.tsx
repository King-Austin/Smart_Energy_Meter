import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface LandingFaqProps {
  theme?: 'light' | 'dark';
}

export const LandingFaq: React.FC<LandingFaqProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: 'How does recharging work without 20-digit STS tokens?',
      a: 'Unlike old-fashioned meters that require manually typing a 20-digit slip onto a physical keypad, Voltrix is an automated smart energy submeter. When you pay via Paystack (card, bank transfer, or USSD), the exact units (kWh) are computed transparently from the tariff rate (₦160/kWh) and credited directly to your meter hardware in real time. Your power balance updates instantly with zero keypad codes.'
    },
    {
      q: 'How does the surge and overvoltage protection safeguard my appliances?',
      a: 'Voltrix features an intelligent high-speed safety switch built right into the meter. You can set your preferred safe voltage limit (e.g. 240V or 250V). If erratic utility power spikes dangerously, Voltrix instantly cuts power to your home in milliseconds — stopping surges before they can fry your refrigerator, TVs, or inverter setup. Once grid power normalizes, you can re-engage with a single tap from your phone.'
    },
    {
      q: 'Is this project an academic research prototype?',
      a: 'Yes. Voltrix was designed and engineered as an undergraduate engineering capstone research project titled "Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics", under the academic supervision of Prof. Mrs. Okezie. It features full live hardware-in-the-loop validation with mobile and web clients.'
    },
    {
      q: 'How does the meter operate during an internet outage?',
      a: 'Voltrix operates with complete edge autonomy. The smart meter continues measuring your electricity consumption, accumulating units, and protecting your appliances even if your home Wi-Fi drops completely. As soon as connectivity returns, your historical data seamlessly syncs back to the cloud.'
    },
    {
      q: 'Can I turn my power on or off remotely?',
      a: 'Yes. Through the mobile app or web dashboard, you have a master whole-home power switch. You can safely turn off electricity to your home or rented apartment with a single tap from anywhere in the world.'
    },
    {
      q: 'How do I install the Voltrix Android APK on my phone?',
      a: 'Click "Download Android App" or scan the QR code to download Voltrix-SmartMeter.apk (5.5 MB). Open the downloaded file on your device and tap Install. The app works natively on any phone running Android 8.0 or newer.'
    }
  ];

  return (
    <section id="faq" className={`max-w-4xl mx-auto px-4 sm:px-8 py-20 border-t transition-colors ${
      isDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
    }`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Everything you need to know about the Voltrix Smart Energy Submeter research prototype.
        </p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border transition-all overflow-hidden ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className={`w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold transition-colors cursor-pointer ${
                isDark ? 'text-white hover:text-[#ff5b26]' : 'text-slate-900 hover:text-[#ff5b26]'
              }`}
            >
              <span>{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  activeFaq === idx ? 'rotate-180 text-[#ff5b26]' : 'text-slate-400'
                }`}
              />
            </button>
            {activeFaq === idx && (
              <div className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3 ${
                isDark ? 'border-white/[0.04] text-slate-300' : 'border-slate-100 text-slate-600'
              }`}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
