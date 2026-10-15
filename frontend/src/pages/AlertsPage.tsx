import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, AlertSummary } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  const loadAlerts = async () => {
    try {
      const [list, sum] = await Promise.all([
        api.getAlerts(
          severityFilter === 'ALL' ? undefined : severityFilter,
          statusFilter === 'ALL' ? undefined : statusFilter
        ),
        api.getAlertSummary()
      ]);
      setAlerts(list);
      setSummary(sum);
      if (list.length > 0 && !selectedAlert) {
        setSelectedAlert(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedAlert) return;
    setUpdating(true);
    try {
      const updated = await api.updateAlertStatus(selectedAlert.id, newStatus, resolutionNotes);
      setSelectedAlert(updated);
      setAlerts(alerts.map(a => a.id === updated.id ? updated : a));
      setResolutionNotes('');
      const sum = await api.getAlertSummary();
      setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-1">
              05. INCIDENT DISPATCH // WARTUNGSPROTOKOLL
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              MAINTENANCE ALERTS & AUDIT
            </h1>
            <p className="text-sm text-black font-medium mt-3 max-w-2xl">
              Physical root-cause sensor deviation z-scores, evidence attribution, and formal technician work-order lifecycle transitions.
            </p>
          </div>

          {summary && (
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <span className="px-3 py-1.5 bg-[#FF3000] text-white uppercase">
                {summary.critical_alerts} CRITICAL
              </span>
              <span className="px-3 py-1.5 bg-black text-white uppercase">
                {summary.high_alerts} HIGH
              </span>
              <span className="px-3 py-1.5 border-2 border-black bg-white text-black uppercase">
                {summary.warning_alerts} WARNING
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-4 border-black bg-white p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase">
          <span className="text-zinc-500">FILTER BY:</span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border-2 border-black px-3 py-1.5 text-xs text-black uppercase focus:outline-none focus:border-[#FF3000]"
          >
            <option value="ALL">ALL SEVERITY</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="WARNING">WARNING</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border-2 border-black px-3 py-1.5 text-xs text-black uppercase focus:outline-none focus:border-[#FF3000]"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <button
          onClick={loadAlerts}
          className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-[#FF3000]"
        >
          REFRESH INCIDENT FEED
        </button>
      </div>

      {/* Asymmetric 7:5 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Incidents Table (7 cols) */}
        <div className="lg:col-span-7 border-4 border-black bg-white p-6 sm:p-8">
          <div className="border-b-2 border-black pb-3 mb-4 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
            <span>REGISTERED WORK ORDERS ({alerts.length})</span>
            <span className="text-[#FF3000]">CHRONOLOGICAL</span>
          </div>

          <div className="divide-y-2 divide-black border-2 border-black max-h-[700px] overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((a) => {
                const isSelected = selectedAlert?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className={`p-4 cursor-pointer transition-none ${
                      isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-xs font-black ${isSelected ? 'text-[#FF3000]' : 'text-black'}`}>
                            {a.id}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                            a.severity === 'CRITICAL'
                              ? 'bg-[#FF3000] text-white'
                              : isSelected
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                          }`}>
                            {a.severity}
                          </span>
                          <span className={`text-[10px] font-mono font-bold border px-1 ${
                            isSelected ? 'border-zinc-700 text-white' : 'border-black text-black'
                          }`}>
                            {a.fault_class}
                          </span>
                        </div>
                        <div className={`text-xs font-bold uppercase mt-1 ${isSelected ? 'text-zinc-200' : 'text-black'}`}>
                          {a.recommendation}
                        </div>
                        <div className={`text-[11px] font-mono mt-1 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          ASSET: {a.machine_id} // {new Date(a.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 uppercase ${
                          a.status === 'RESOLVED'
                            ? 'bg-emerald-700 text-white'
                            : a.status === 'INVESTIGATING'
                            ? 'bg-blue-700 text-white'
                            : isSelected
                            ? 'bg-zinc-800 text-white'
                            : 'bg-black text-white'
                        }`}>
                          {a.status}
                        </span>
                        <div className={`text-xs font-mono font-black mt-2 ${isSelected ? 'text-white' : 'text-black'}`}>
                          {(a.anomaly_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center font-mono text-xs font-bold text-zinc-500 uppercase">
                NO ALERTS FOUND MATCHING CRITERIA.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Evidence & Action Drawer (5 cols) */}
        <div className="lg:col-span-5">
          {selectedAlert ? (
            <div className="border-4 border-black bg-white p-6 sm:p-8 space-y-6">
              {/* Alert Header */}
              <div className="border-b-4 border-black pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-black text-[#FF3000]">{selectedAlert.id}</span>
                  <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-bold uppercase">
                    {selectedAlert.severity} PRIORITY
                  </span>
                </div>
                <div className="text-base font-black uppercase text-black mt-1">
                  ASSET: {selectedAlert.machine_id}
                </div>
                <div className="text-xs font-mono text-zinc-600 mt-0.5">
                  DETECTED: {new Date(selectedAlert.detected_at).toLocaleString()}
                </div>
              </div>

              {/* Sensor Evidence Attribution Table */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-2">
                  SENSOR DEVIATION ATTRIBUTION (Z-SCORE)
                </div>
                {selectedAlert.sensor_evidence && selectedAlert.sensor_evidence.length > 0 ? (
                  <div className="border-2 border-black overflow-x-auto">
                    <table className="min-w-full text-left font-mono text-xs divide-y-2 divide-black">
                      <thead className="bg-black text-white uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-zinc-800">SENSOR</th>
                          <th className="p-2 border-r border-zinc-800">READING</th>
                          <th className="p-2 border-r border-zinc-800">BASELINE</th>
                          <th className="p-2">DEVIATION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black text-black bg-white">
                        {selectedAlert.sensor_evidence.map((ev, i) => (
                          <tr key={i} className="hover:bg-[#F2F2F2]">
                            <td className="p-2 font-bold border-r border-black">{ev.sensor}</td>
                            <td className="p-2 text-[#FF3000] font-black border-r border-black">
                              {ev.value} {ev.unit}
                            </td>
                            <td className="p-2 border-r border-black">{ev.baseline_mean} {ev.unit}</td>
                            <td className="p-2 font-black text-black">
                              {ev.direction} (z={ev.deviation_z})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-2 border-black p-3 text-center font-mono text-xs text-zinc-600 bg-[#F2F2F2]">
                    MULTIPLE COVARIATE SHIFTS IDENTIFIED.
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="border-2 border-black p-4 bg-[#F2F2F2]">
                <div className="flex items-center space-x-1.5 font-mono text-xs font-black uppercase text-[#FF3000] mb-1">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>ACTIONABLE INSPECTION GUIDANCE</span>
                </div>
                <p className="text-xs font-bold text-black uppercase">
                  {selectedAlert.recommendation}
                </p>
                <span className="block mt-2 text-[10px] font-mono text-zinc-500 uppercase">
                  * RECOMMENDATION DERIVED FROM FAILURE MODES. CONFIRMATORY TEARDOWN REQUIRED.
                </span>
              </div>

              {/* Status Workflow Action */}
              <div className="space-y-4 border-t-2 border-black pt-4">
                <div className="font-mono text-xs uppercase tracking-widest text-black font-bold">
                  INCIDENT WORKFLOW TRANSITION
                </div>

                <div className="grid grid-cols-4 border-2 border-black divide-x-2 divide-black">
                  {['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(st)}
                      disabled={updating || selectedAlert.status === st}
                      className={`py-2 text-[10px] font-mono font-black uppercase transition-none ${
                        selectedAlert.status === st
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-[#FF3000] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                    TECHNICIAN RESOLUTION LOG
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="ENTER TECHNICIAN NOTES, INSPECTION FINDINGS, OR REPLACED PARTS..."
                    className="w-full bg-white border-2 border-black p-2 text-xs font-mono font-medium text-black uppercase focus:outline-none focus:border-[#FF3000]"
                  ></textarea>
                </div>

                {selectedAlert.resolution_notes && (
                  <div className="border-2 border-black p-3 bg-white font-mono text-xs">
                    <span className="text-[10px] uppercase text-zinc-500 block">EXISTING NOTES:</span>
                    <p className="font-bold text-black uppercase mt-0.5">{selectedAlert.resolution_notes}</p>
                    {selectedAlert.resolved_at && (
                      <span className="text-[10px] text-[#FF3000] uppercase block mt-1">
                        RESOLVED: {new Date(selectedAlert.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Human-in-the-Loop Active Learning Feedback */}
                <div className="border-4 border-black p-4 bg-[#F2F2F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3000] flex items-center space-x-1.5">
                      <span className="h-2 w-2 bg-[#FF3000]"></span>
                      <span>HUMAN-IN-THE-LOOP RETRAINING AUDIT</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold border border-black bg-white px-2 py-0.5 uppercase">
                      ACTIVE QUEUE
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-600 uppercase">
                    Validate ML diagnosis on the physical asset. Confirmed samples feed directly into the retraining pipeline.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-black mb-0.5">VERDICT ACCURACY</label>
                      <select
                        id="feedback-accuracy"
                        defaultValue="1"
                        className="w-full border-2 border-black p-1.5 bg-white text-xs font-mono font-bold"
                      >
                        <option value="1">CONFIRMED TRUE POSITIVE</option>
                        <option value="0">FALSE ALARM (NOISE / OPERATOR)</option>
                        <option value="2">MODIFIED / SECONDARY CAUSE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-black mb-0.5">VERIFIED ROOT CAUSE</label>
                      <select
                        id="feedback-fault"
                        defaultValue={selectedAlert.fault_class}
                        className="w-full border-2 border-black p-1.5 bg-white text-xs font-mono font-bold"
                      >
                        <option value="TWF">TWF (TOOL WEAR)</option>
                        <option value="HDF">HDF (HEAT DISSIPATION)</option>
                        <option value="PWF">PWF (POWER FAILURE)</option>
                        <option value="OSF">OSF (OVERSTRAIN)</option>
                        <option value="BEARING_FAULT">BEARING_FAULT</option>
                        <option value="NORMAL">NORMAL / FALSE TRIGGER</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="feedback-wo"
                      placeholder="CMMS WORK ORDER (E.G. WO-2026-9812)"
                      className="flex-1 border-2 border-black p-1.5 bg-white text-xs font-mono uppercase focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const accEl = document.getElementById('feedback-accuracy') as HTMLSelectElement;
                        const faultEl = document.getElementById('feedback-fault') as HTMLSelectElement;
                        const woEl = document.getElementById('feedback-wo') as HTMLInputElement;
                        try {
                          await api.submitAlertFeedback(selectedAlert.id, {
                            technician_name: 'Lead Maintenance Tech',
                            is_accurate: parseInt(accEl?.value || '1'),
                            verified_fault_class: faultEl?.value || selectedAlert.fault_class,
                            work_order_id: woEl?.value || 'WO-AUTO',
                            technician_notes: resolutionNotes || 'Physical inspection confirmed by operator.',
                            queue_for_retraining: true
                          });
                          alert('FEEDBACK LOGGED TO ACTIVE RETRAINING QUEUE!');
                          loadAlerts();
                        } catch (e: any) {
                          alert('FAILED TO LOG FEEDBACK: ' + e.message);
                        }
                      }}
                      className="border-2 border-black bg-black text-white hover:bg-[#FF3000] px-3 py-1.5 text-xs font-mono font-black uppercase"
                    >
                      SUBMIT TO QUEUE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 border-4 border-black bg-[#F2F2F2] text-center font-mono text-xs font-bold uppercase tracking-widest text-black">
              SELECT AN INCIDENT WORK ORDER TO INSPECT SENSOR ATTRIBUTION.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
