import React from 'react';
import { 
  Grid3X3, 
  Flame, 
  Layers, 
  Clock, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MapPin,
  CheckCircle2,
  Box
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import HeatmapViewer from '../components/HeatmapViewer';

export default function TrafficShelves({ session, shelves }) {
  if (!session) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium bg-[#0D1527]/85 border border-blue-500/20 rounded-3xl shadow-card-glow">
        No active video session. Please upload a video in the Video Analysis tab.
      </div>
    );
  }

  const summary = session.summary || {};
  const trafficInfo = {
    high_traffic_zones: summary.high_traffic_zones || [],
    low_traffic_zones: summary.low_traffic_zones || [],
    zone_distribution: summary.zone_distribution || []
  };

  // Sort shelves by visit count
  const sortedShelves = [...shelves].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));
  const mostVisited = sortedShelves[0];
  const leastVisited = sortedShelves[sortedShelves.length - 1];

  const chartData = sortedShelves.map((s) => ({
    name: s.shelf_id,
    label: s.label,
    visits: s.visit_count || 0,
    dwell: s.avg_dwell_time || 0,
    interactions: s.interaction_count || 0
  }));

  return (
    <div className="space-y-7">
      {/* Shelf Intelligence Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-card-glow">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recognized Units</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{shelves.length}</span>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">Autonomous</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Mapped dynamically by vision pipeline</p>
        </div>

        <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-card-glow">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Performing Shelf</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 truncate">
              {mostVisited ? mostVisited.shelf_id : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-bold">({mostVisited?.visit_count || 0} visits)</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 truncate font-medium">{mostVisited?.label || 'Calculating...'}</p>
        </div>

        <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-card-glow">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lowest Foot Traffic</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 truncate">
              {leastVisited ? leastVisited.shelf_id : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-bold">({leastVisited?.visit_count || 0} visits)</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 truncate font-medium">{leastVisited?.label || 'Calculating...'}</p>
        </div>

        <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-card-glow">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Shelf Dwell</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              {summary.avg_shelf_dwell_time ?? 0.0}s
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Customer consideration window</p>
        </div>
      </div>

      {/* Movement Heatmap */}
      <HeatmapViewer
        heatmapUrl={session.heatmap_path}
        trafficInfo={trafficInfo}
        session={session}
      />

      {/* Detailed Shelves Recognition Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shelf Recognition List */}
        <div className="lg:col-span-2 bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
                <Box className="w-4 h-4 text-blue-400" />
                <span>Automatically Recognized Shelf Units</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Physical retail shelf locations identified dynamically by computer vision contours.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070C18]/80 text-slate-400 uppercase tracking-wider border-b border-blue-500/20">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Dynamic ID & Label</th>
                  <th className="py-3.5 px-4 font-bold">Bounding Box Coordinates</th>
                  <th className="py-3.5 px-4 text-center font-bold">Confidence</th>
                  <th className="py-3.5 px-4 text-center font-bold">Visits</th>
                  <th className="py-3.5 px-4 text-center font-bold">Avg Dwell</th>
                  <th className="py-3.5 px-4 text-center font-bold">Interactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 text-slate-300">
                {shelves.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-blue-600/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-neon-blue" />
                        <div>
                          <p className="font-extrabold text-white">{s.shelf_id}</p>
                          <p className="text-[11px] text-slate-400">{s.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 font-medium">
                      [{s.bbox.map(c => Math.round(c)).join(', ')}]
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-[11px]">
                        {(s.detection_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-white text-sm">
                      {s.visit_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300">
                      {s.avg_dwell_time?.toFixed(1)}s
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-extrabold text-[11px]">
                        {s.interaction_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shelf Visit Distribution Chart */}
        <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white mb-1 tracking-tight">Visits per Shelf</h3>
            <p className="text-xs text-slate-400 mb-5 font-medium">Traffic volume distribution</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1527', color: '#FFFFFF', borderColor: '#3B82F6', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="visits" name="Visits" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#06B6D4' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-900/30 text-[11px] text-slate-400 font-medium">
            Cyan bar denotes highest engagement retail shelf.
          </div>
        </div>
      </div>
    </div>
  );
}
