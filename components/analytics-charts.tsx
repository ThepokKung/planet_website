"use client";

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Droplets, 
  Activity, 
  Thermometer, 
  ArrowUpRight, 
  TrendingUp,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalWaterUsed: number;
    totalEvents: number;
    avgMoisture: number;
  };
  moistureTrend: {
    date: string;
    moisture: number;
  }[];
  waterUsage: {
    date: string;
    amount: number;
  }[];
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const { summary, moistureTrend, waterUsage } = data;

  const kpis = [
    { 
      label: "Total Water Used", 
      value: `${summary.totalWaterUsed.toLocaleString()} ml`, 
      icon: Droplets, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Watering Events", 
      value: summary.totalEvents.toLocaleString(), 
      icon: Activity, 
      color: "text-[#0E6633]", 
      bg: "bg-green-50" 
    },
    { 
      label: "Avg Moisture", 
      value: `${summary.avgMoisture.toFixed(1)}%`, 
      icon: Thermometer, 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#757575] uppercase tracking-widest">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#1e1e1e]">
              {kpi.value}
            </div>
            <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${kpi.color}`}>
              <TrendingUp className="w-3 h-3" /> System Analysis
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Moisture Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-600" /> Moisture Trend
            </h3>
            <span className="text-[10px] font-bold text-[#757575] bg-gray-50 px-2 py-1 rounded-full uppercase">Avg %</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moistureTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#757575', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#757575', fontWeight: 'bold' }}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Water Usage */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" /> Water Usage
            </h3>
            <span className="text-[10px] font-bold text-[#757575] bg-gray-50 px-2 py-1 rounded-full uppercase">Total ml</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#757575', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#757575', fontWeight: 'bold' }}
                  unit=" ml"
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#2563eb" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
