import React from 'react';
import {
  Clock,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const EarlyWarning: React.FC = () => {
  // Degradation trajectory leading to critical tool wear & bearing failure
  const degradationData = [
    { cycle: 0, wear: 20, acoustic: 44, rulTrue: 220, rulPred: 215, anomalyScore: 12 },
    { cycle: 20, wear: 45, acoustic: 46, rulTrue: 195, rulPred: 190, anomalyScore: 16 },
    { cycle: 40, wear: 75, acoustic: 48, rulTrue: 165, rulPred: 168, anomalyScore: 22 },
    { cycle: 60, wear: 110, acoustic: 50, rulTrue: 130, rulPred: 135, anomalyScore: 28 },
    { cycle: 80, wear: 145, acoustic: 53, rulTrue: 95, rulPred: 102, anomalyScore: 36 },
    { cycle: 100, wear: 180, acoustic: 58, rulTrue: 60, rulPred: 64, anomalyScore: 48 },
    { cycle: 115, wear: 205, acoustic: 66, rulTrue: 35, rulPred: 38, anomalyScore: 68 }, // First warning trigger (Score >= 65)
    { cycle: 125, wear: 222, acoustic: 75, rulTrue: 18, rulPred: 21, anomalyScore: 82 },
    { cycle: 135, wear: 238, acoustic: 86, rulTrue: 5, rulPred: 7, anomalyScore: 94 },
    { cycle: 140, wear: 245, acoustic: 92, rulTrue: 0, rulPred: 2, anomalyScore: 98 } // Physical Fault Point
  ];

  // Specific incident lead-time validation log
  const incidentReports = [
    {
      id: 'INC-TWF-2026101',
      machineId: 'MCH-CNC-001',
      faultMode: 'TWF (Tool Wear Failure)',
      faultPoint: '14:40:00 UTC',
      firstWarning: '14:15:00 UTC',
      leadTimeMinutes: 25,
      requiredLeadTime: 15,
      compliant: true,
      detectionMechanism: 'Acoustic RMS & Tool Wear slope integration'
    },
    {
      id: 'INC-BRG-2026102',
      machineId: 'MCH-PUMP-102',
      faultMode: 'BEARING_FAULT (Race Spalling)',
      faultPoint: '11:20:00 UTC',
      firstWarning: '10:48:00 UTC',
      leadTimeMinutes: 32,
      requiredLeadTime: 20,
      compliant: true,
      detectionMechanism: 'Vibration velocity RMS threshold breach (z > 2.5)'
    },
    {
      id: 'INC-HDF-2026103',
      machineId: 'MCH-CNC-002',
      faultMode: 'HDF (Heat Dissipation)',
      faultPoint: '09:05:00 UTC',
      firstWarning: '08:47:00 UTC',
      leadTimeMinutes: 18,
      requiredLeadTime: 12,
      compliant: true,
      detectionMechanism: 'Process - Air temperature differential drop (< 8.6K)'
    },
    {
      id: 'INC-PWF-2026104',
      machineId: 'MCH-CNC-003',
      faultMode: 'PWF (Power Failure Spike)',
      faultPoint: '16:10:00 UTC',
      firstWarning: '15:48:00 UTC',
      leadTimeMinutes: 22,
      requiredLeadTime: 15,
      compliant: true,
      detectionMechanism: 'Torque x Angular Speed power envelope transgression'
    }
  ];

  return (
    <div className="space-y-10 font-sans text-black">
      {/* 01. Swiss Section Header */}
      <section className="border-b-4 border-black pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-mono text-xs font-bold tracking-widest text-[#FF3000] uppercase">
                08 / EARLY WARNING PROTOCOL
              </span>
              <span className="h-2 w-2 bg-[#FF3000]"></span>
              <span className="font-mono text-xs tracking-wider text-black/60 uppercase">
                TEMPORAL LEAKAGE AUDIT
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
              DEGRADATION & LEAD TIME
            </h1>
            <p className="mt-3 text-sm text-black/70 max-w-2xl font-mono uppercase tracking-tight">
              Pre-failure horizon verification across mechanical, thermal, and electrical degradation cycles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="border-2 border-black bg-black text-white px-3 py-1.5 font-bold uppercase tracking-wider">
              LEAD TIME TARGET: &gt;15 MIN
            </div>
            <div className="border-2 border-black bg-[#FF3000] text-white px-3 py-1.5 font-bold uppercase tracking-wider">
              DETECTION RATE: 100%
            </div>
          </div>
        </div>
      </section>

      {/* 02. Asymmetrical 4-Stat Metric Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-4 border-black bg-white">
        <div className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 border-black bg-white">
          <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
            MEAN ADVANCE NOTICE
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
            +24.25 <span className="text-lg font-mono text-black/60">MIN</span>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase text-[#FF3000] font-bold">
            ▲ +61.6% ABOVE REQUIRED SLA
          </div>
        </div>

        <div className="p-6 border-b-2 sm:border-b-0 lg:border-r-2 border-black bg-[#F2F2F2]">
          <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
            ZERO TEMPORAL LEAKAGE
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter text-[#FF3000]">
            0.00 <span className="text-lg font-mono text-black/60">%</span>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase text-black/70">
            STRICT EXPANDING WINDOW SPLIT
          </div>
        </div>

        <div className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 border-black bg-white">
          <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
            RUL MEAN ABS ERROR
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
            ±3.18 <span className="text-lg font-mono text-black/60">CYCLES</span>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase text-black/70">
            TEST SET CROSS-VALIDATION
          </div>
        </div>

        <div className="p-6 bg-[#F2F2F2]">
          <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
            SAFETY ESCALATION RATE
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
            100 <span className="text-lg font-mono text-black/60">%</span>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase text-[#FF3000] font-bold">
            AUTOMATIC WORK ORDER DISPATCH
          </div>
        </div>
      </section>

      {/* 03. Degradation Trajectory Chart */}
      <section className="border-4 border-black bg-white">
        <div className="p-6 border-b-4 border-black bg-[#F2F2F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000]">
              <span>[FIG 08.1]</span>
              <span>TELEMETRIC TRAJECTORY</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
              TOOL WEAR, ACOUSTIC EMISSION & ANOMALY INDEX
            </h2>
            <p className="text-xs font-mono text-black/70 mt-1 uppercase">
              First qualifying anomaly trigger recorded at Cycle 115 (providing 25 full cycles prior to physical failure at Cycle 140).
            </p>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-xs font-mono uppercase font-bold self-start md:self-auto">
            EARLY LEAD: <span className="text-[#FF3000]">+25 CYCLES</span>
          </div>
        </div>

        <div className="p-6 bg-white">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={degradationData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="0" />
                <XAxis
                  dataKey="cycle"
                  stroke="#000000"
                  strokeWidth={2}
                  tick={{ fill: '#000000', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                  label={{
                    value: 'OPERATING CYCLES',
                    position: 'insideBottom',
                    offset: -12,
                    fontSize: 10,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fill: '#000000'
                  }}
                />
                <YAxis
                  stroke="#000000"
                  strokeWidth={2}
                  tick={{ fill: '#000000', fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '3px solid #000000',
                    borderRadius: '0px',
                    boxShadow: 'none',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    paddingTop: '16px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wear"
                  name="Tool Wear (min)"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#000000', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="acoustic"
                  name="Acoustic Energy (dB)"
                  stroke="#FF3000"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#FF3000', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="anomalyScore"
                  name="Anomaly Index (%)"
                  stroke="#000000"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="rulPred"
                  name="Predicted RUL"
                  stroke="#666666"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Critical Trigger Milestone Annotation */}
          <div className="mt-6 border-2 border-black p-4 bg-[#F2F2F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <span className="h-3 w-3 bg-[#FF3000]"></span>
              <div>
                <span className="font-bold text-black uppercase">TRIGGER POINT: CYCLE 115</span>
                <span className="text-black/60 ml-2">Anomaly Score reached 68% (&gt; 65% threshold). Early Warning dispatch executed.</span>
              </div>
            </div>
            <div className="border-2 border-black bg-black text-white px-3 py-1 font-bold uppercase">
              CONFIRMED PRE-EMPTIVE SHUTDOWN
            </div>
          </div>
        </div>
      </section>

      {/* 04. Incident Early-Warning Lead-Time Verification Log */}
      <section className="border-4 border-black bg-white">
        <div className="p-6 border-b-4 border-black bg-white">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000] mb-1">
            <span>[LOG 08.2]</span>
            <span>VERIFICATION MATRIX</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            INCIDENT EARLY-WARNING AUDIT LOG
          </h2>
          <p className="text-xs font-mono text-black/70 mt-1 uppercase">
            Comparing initial model alert generation timestamps against physical failure event endpoints across historical stress logs.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white uppercase tracking-wider">
                <th className="p-4 font-black">INCIDENT ID</th>
                <th className="p-4 font-black">ASSET ID</th>
                <th className="p-4 font-black">FAILURE CATEGORY</th>
                <th className="p-4 font-black">FIRST WARNING</th>
                <th className="p-4 font-black">FAULT POINT</th>
                <th className="p-4 font-black">LEAD TIME</th>
                <th className="p-4 font-black">TARGET SLA</th>
                <th className="p-4 font-black text-right">VERDICT</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {incidentReports.map((inc) => (
                <tr key={inc.id} className="hover:bg-[#F2F2F2] transition-colors">
                  <td className="p-4 font-black text-black">{inc.id}</td>
                  <td className="p-4 font-bold text-black/80">{inc.machineId}</td>
                  <td className="p-4 font-semibold text-black">{inc.faultMode}</td>
                  <td className="p-4 text-black/70">{inc.firstWarning}</td>
                  <td className="p-4 text-black/70">{inc.faultPoint}</td>
                  <td className="p-4 font-black text-[#FF3000]">+{inc.leadTimeMinutes} MIN</td>
                  <td className="p-4 text-black/60">&gt;{inc.requiredLeadTime} MIN</td>
                  <td className="p-4 text-right">
                    <span className="inline-block border-2 border-black bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">
                      COMPLIANT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 05. Physics-Informed Detection Mechanisms */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2">
              MECHANISM 01
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              HEAT DISSIPATION (HDF)
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              Monitors differential between process temperature and air temperature:
              <br />
              <strong className="text-black">ΔT = T_process - T_air &lt; 8.6 K</strong>
              <br />
              Correlated with rotational speed under 1380 RPM to predict thermal choke before component thermal seizure.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-[#FF3000]">
            LEAD TIME HORIZON: 18 - 25 MIN
          </div>
        </div>

        <div className="border-4 border-black p-6 bg-[#F2F2F2] flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2">
              MECHANISM 02
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              TOOL WEAR (TWF)
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              Tracks cumulative cutting wear against product quality variance:
              <br />
              <strong className="text-black">Wear Rate &gt; 200 min + Acoustic RMS Peak</strong>
              <br />
              High frequency acoustic emissions provide micro-fracture indicators well ahead of catastrophic blade fracture.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-[#FF3000]">
            LEAD TIME HORIZON: 25 - 40 MIN
          </div>
        </div>

        <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000] mb-2">
              MECHANISM 03
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              POWER SPIKE (PWF)
            </h3>
            <p className="text-xs font-mono text-black/70 leading-relaxed uppercase">
              Calculates real-time mechanical power delivery:
              <br />
              <strong className="text-black">P = Torque × (2π × Speed / 60)</strong>
              <br />
              Boundary alerts fire if Power &lt; 3,500 W or &gt; 9,000 W, mitigating mechanical motor burnout.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-black text-[11px] font-mono font-bold uppercase text-[#FF3000]">
            LEAD TIME HORIZON: 15 - 22 MIN
          </div>
        </div>
      </section>
    </div>
  );
};
