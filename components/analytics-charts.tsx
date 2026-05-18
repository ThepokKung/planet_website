"use client";

import { useEffect, useRef, useState } from 'react';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  Droplets, 
  Activity, 
  Thermometer, 
  TrendingUp
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

function MeasuredChartContainer({
  children,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const safeWidth = Math.floor(width);
      const safeHeight = Math.floor(height);

      setSize((prev) => {
        if (prev.width === safeWidth && prev.height === safeHeight) {
          return prev;
        }

        return { width: safeWidth, height: safeHeight };
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[300px] w-full min-w-0">
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-4 min-w-0">
              <span className="text-xs font-bold text-[#757575] uppercase tracking-widest leading-tight break-words min-w-0 flex-1">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#1e1e1e] leading-tight break-words">
              {kpi.value}
            </div>
            <div className={`text-xs mt-2 font-medium flex items-start gap-1 ${kpi.color}`}>
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
          <MeasuredChartContainer>
            {({ width, height }) => (
              <LineChart width={width} height={height} data={moistureTrend}>
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
            )}
          </MeasuredChartContainer>
        </div>

        {/* Bar Chart: Water Usage */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" /> Water Usage
            </h3>
            <span className="text-[10px] font-bold text-[#757575] bg-gray-50 px-2 py-1 rounded-full uppercase">Total ml</span>
          </div>
          <MeasuredChartContainer>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={waterUsage}>
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
            )}
          </MeasuredChartContainer>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-sm mt-8">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
        <p className="text-[11px] font-bold text-[#757575] tracking-widest text-center">
          ค่า ml ที่แสดงคือค่าเปรียบเทียบจากการคำนวณ <span className="text-[#0E6633]">(เวลา x Flowrate)</span>
        </p>
      </div>
    </div>
  );
}
