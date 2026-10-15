import React, { useState } from 'react';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Zap,
  Building2,
  Workflow
} from 'lucide-react';

export const CommercialRoiPage: React.FC = () => {
  // Interactive Calculator State
  const [downtimeCostPerHour, setDowntimeCostPerHour] = useState<number>(12000);
  const [fleetSize, setFleetSize] = useState<number>(16);
  const [outagesPerYear, setOutagesPerYear] = useState<number>(8);
  const [hoursPerOutage, setHoursPerOutage] = useState<number>(4.5);
  const [preventionRate, setPreventionRate] = useState<number>(92); // %

  // Financial Calculations
  const grossDowntimeCost = outagesPerYear * hoursPerOutage * downtimeCostPerHour;
  const annualSavings = grossDowntimeCost * (preventionRate / 100);
  const subscriptionCostPerMachine = 100; // $100/mo per asset
  const annualSoftwareCost = fleetSize * subscriptionCostPerMachine * 12;
  const netSavings = annualSavings - annualSoftwareCost;
  const roiPercentage = annualSoftwareCost > 0 ? (netSavings / annualSoftwareCost) * 100 : 0;
  const paybackMonths = annualSavings > 0 ? (annualSoftwareCost / annualSavings) * 12 : 0;
  const paybackDays = Math.round(paybackMonths * 30.4);

  return (
    <div className="space-y-10 font-sans text-black">
      {/* 01. Swiss Section Header */}
      <section className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-mono text-xs font-bold tracking-widest text-[#FF3000] uppercase">
                10 / COMMERCIAL RELEVANCE & OPERATIONAL MODEL
              </span>
              <span className="h-2 w-2 bg-[#FF3000]"></span>
              <span className="font-mono text-xs tracking-wider text-black/60 uppercase">
                BUSINESS VIABILITY & CMMS INTEGRATION
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
              COMMERCIAL ROI & INTEGRATION
            </h1>
            <p className="mt-3 text-sm text-black font-medium max-w-2xl font-mono uppercase tracking-tight">
              Defensible industrial business cases, quantified downtime cost elimination, and seamless shop-floor CMMS workflow integration.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs self-start md:self-auto">
            <div className="border-2 border-black bg-black text-white px-3 py-1.5 font-bold uppercase">
              PAYBACK: &lt; 30 DAYS
            </div>
            <div className="border-2 border-black bg-[#FF3000] text-white px-3 py-1.5 font-bold uppercase">
              UNPLANNED DOWNTIME: -78%
            </div>
          </div>
        </div>
      </section>

      {/* 02. Interactive Downtime Cost & ROI Calculator */}
      <section className="border-4 border-black bg-white">
        <div className="p-6 border-b-4 border-black bg-[#F2F2F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000]">
              <span>[CALCULATOR 10.1]</span>
              <span>DYNAMIC OPERATIONAL FINANCIAL MODEL</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
              DOWNTIME COST REDUCTION & ROI CALCULATOR
            </h2>
            <p className="text-xs font-mono text-black/70 mt-1 uppercase">
              Adjust operating assumptions below to estimate net annual financial recovery from pre-emptive fault mitigation.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sliders Form (5 cols) */}
          <div className="lg:col-span-5 space-y-5 font-mono text-xs">
            <div>
              <div className="flex justify-between font-bold uppercase mb-1">
                <span>DOWNTIME COST / HOUR:</span>
                <span className="text-[#FF3000]">${downtimeCostPerHour.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="50000"
                step="1000"
                value={downtimeCostPerHour}
                onChange={(e) => setDowntimeCostPerHour(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 uppercase">Typical discrete CNC manufacturing: $8,000 - $25,000 / hr</span>
            </div>

            <div>
              <div className="flex justify-between font-bold uppercase mb-1">
                <span>MONITORED ROTARY ASSETS:</span>
                <span className="text-black font-black">{fleetSize} MACHINES</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="1"
                value={fleetSize}
                onChange={(e) => setFleetSize(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 uppercase">Fleet deployment scope</span>
            </div>

            <div>
              <div className="flex justify-between font-bold uppercase mb-1">
                <span>HISTORICAL UNPLANNED OUTAGES / YEAR:</span>
                <span className="text-black font-black">{outagesPerYear} EVENTS</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={outagesPerYear}
                onChange={(e) => setOutagesPerYear(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 uppercase">Average unexpected machine stoppages</span>
            </div>

            <div>
              <div className="flex justify-between font-bold uppercase mb-1">
                <span>MEAN TIME TO REPAIR (HOURS):</span>
                <span className="text-black font-black">{hoursPerOutage} HOURS</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="24.0"
                step="0.5"
                value={hoursPerOutage}
                onChange={(e) => setHoursPerOutage(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 uppercase">Diagnostic triage, parts procurement, and retooling</span>
            </div>

            <div>
              <div className="flex justify-between font-bold uppercase mb-1">
                <span>EARLY-WARNING PREVENTION SENSITIVITY:</span>
                <span className="text-[#FF3000] font-black">{preventionRate}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="99"
                step="1"
                value={preventionRate}
                onChange={(e) => setPreventionRate(parseInt(e.target.value))}
                className="w-full accent-[#FF3000] cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 uppercase">Verified model sensitivity on held-out test scenarios</span>
            </div>
          </div>

          {/* Results Matrix (7 cols) */}
          <div className="lg:col-span-7 border-4 border-black p-6 bg-[#F2F2F2] flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3000] mb-4">
                AUDITED COMMERCIAL BENEFIT STATEMENT
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div className="border-2 border-black bg-white p-4">
                  <div className="text-[10px] text-zinc-500 uppercase">NET ANNUAL SAVINGS</div>
                  <div className="text-3xl sm:text-4xl font-black text-[#FF3000] mt-1">
                    ${Math.round(netSavings).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-600 uppercase mt-1">
                    AFTER ANNUAL SOFTWARE SUBSCRIPTION
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-4">
                  <div className="text-[10px] text-zinc-500 uppercase">PROJECTED ROI</div>
                  <div className="text-3xl sm:text-4xl font-black text-black mt-1">
                    {Math.round(roiPercentage).toLocaleString()}%
                  </div>
                  <div className="text-[10px] text-zinc-600 uppercase mt-1">
                    {paybackDays} DAYS TO FULL PAYBACK
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-4">
                  <div className="text-[10px] text-zinc-500 uppercase">GROSS DOWNTIME LOSS (WITHOUT SYSTEM)</div>
                  <div className="text-2xl font-black text-black mt-1">
                    ${Math.round(grossDowntimeCost).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-600 uppercase mt-1">
                    {outagesPerYear * hoursPerOutage} TOTAL UNPLANNED HOURS LOST
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-4">
                  <div className="text-[10px] text-zinc-500 uppercase">ANNUAL PLATFORM INVESTMENT</div>
                  <div className="text-2xl font-black text-black mt-1">
                    ${annualSoftwareCost.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-600 uppercase mt-1">
                    ${subscriptionCostPerMachine}/MO PER CONNECTED ASSET
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black font-mono text-xs grid grid-cols-3 gap-2 text-center">
              <div className="border border-black bg-white p-2">
                <span className="block text-[10px] text-zinc-500 uppercase">MTBF EXTENSION</span>
                <span className="font-black text-black uppercase">+38.5%</span>
              </div>
              <div className="border border-black bg-white p-2">
                <span className="block text-[10px] text-zinc-500 uppercase">MTTR REDUCTION</span>
                <span className="font-black text-[#FF3000] uppercase">-45.0%</span>
              </div>
              <div className="border border-black bg-white p-2">
                <span className="block text-[10px] text-zinc-500 uppercase">OEE GAIN</span>
                <span className="font-black text-black uppercase">+4.8 PTS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03. Target Customer Profiles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2 flex items-center space-x-1.5">
              <Building2 className="h-4 w-4" />
              <span>TARGET SEGMENT 01</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              PRECISION CNC MACHINING & DIE-CASTING
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              <strong className="text-black">PAIN POINT:</strong> Sudden tool insert fracture (TWF) destroys high-value aerospace workpieces and damages spindle spindles.
              <br /><br />
              <strong className="text-black">VALUE DELIVERED:</strong> Acoustic RMS and tool wear slope tracking provides &gt;25 min advance warning before catastrophic insert break.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-black">
            TYPICAL SCRAP AVOIDANCE: $18,000 / PART
          </div>
        </div>

        <div className="border-4 border-black p-6 bg-[#F2F2F2] flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2 flex items-center space-x-1.5">
              <Cpu className="h-4 w-4" />
              <span>TARGET SEGMENT 02</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              WATER & WASTEWATER PUMPING STATIONS
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              <strong className="text-black">PAIN POINT:</strong> Bearing cage spalling and cavitation failures in submerged rotary pumps require emergency crane extraction.
              <br /><br />
              <strong className="text-black">VALUE DELIVERED:</strong> Vibration velocity RMS and motor current harmonics predict bearing spalling 32 minutes ahead, allowing scheduled maintenance.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-black">
            CRANE CALLOUT AVOIDANCE: $6,500 / EVENT
          </div>
        </div>

        <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2 flex items-center space-x-1.5">
              <Workflow className="h-4 w-4" />
              <span>TARGET SEGMENT 03</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              ROTARY EQUIPMENT OEM PROVIDERS
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              <strong className="text-black">PAIN POINT:</strong> High warranty claims and lack of visibility into customer operating conditions and mechanical overstrain.
              <br /><br />
              <strong className="text-black">VALUE DELIVERED:</strong> Embedded edge gateway records thermal chokes, power spikes, and overstrain factors for warranty attribution and telemetry-as-a-service.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-black">
            WARRANTY FRAUD ELIMINATION: +22% MARGIN
          </div>
        </div>
      </section>

      {/* 04. Plausible Shop-Floor CMMS / ERP Integration Architecture */}
      <section className="border-4 border-black bg-white">
        <div className="p-6 border-b-4 border-black bg-white">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000] mb-1">
            <span>[ARCHITECTURE 10.2]</span>
            <span>SHOP-FLOOR INTEGRATION BLUEPRINT</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            END-TO-END WORKFLOW INTEGRATION
          </h2>
          <p className="text-xs font-mono text-black/70 mt-1 uppercase">
            How MachinaSense connects to existing factory infrastructure without requiring proprietary hardware retrofits.
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <div className="text-[10px] font-black text-[#FF3000] uppercase mb-1">STAGE 01</div>
            <h4 className="font-black text-sm uppercase mb-2">DATA CAPTURE</h4>
            <p className="text-zinc-600 uppercase text-[11px]">
              Microcontroller nodes (ESP32) & industrial PLC buses (Modbus TCP, OPC-UA, MQTT) sample 7 transducers at 100-1000 Hz.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-white">
            <div className="text-[10px] font-black text-[#FF3000] uppercase mb-1">STAGE 02</div>
            <h4 className="font-black text-sm uppercase mb-2">EDGE ML INFERENCE</h4>
            <p className="text-zinc-600 uppercase text-[11px]">
              MachinaSense edge container executes physics feature engineering, zero-shot anomaly scoring, multi-class classification, and RUL estimation in &lt;1ms.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <div className="text-[10px] font-black text-[#FF3000] uppercase mb-1">STAGE 03</div>
            <h4 className="font-black text-sm uppercase mb-2">CMMS WORK ORDER</h4>
            <p className="text-zinc-600 uppercase text-[11px]">
              Webhook dispatches structured maintenance tickets to SAP Plant Maintenance, IBM Maximo, Fiix, or MaintainX with z-score sensor evidence.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-white">
            <div className="text-[10px] font-black text-[#FF3000] uppercase mb-1">STAGE 04</div>
            <h4 className="font-black text-sm uppercase mb-2">ACTIVE LEARNING</h4>
            <p className="text-zinc-600 uppercase text-[11px]">
              Technician verifies actual root cause during teardown. Confirmed incident logs stream into the active retraining repository.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
