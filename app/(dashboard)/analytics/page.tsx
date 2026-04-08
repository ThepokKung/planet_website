import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { 
  BarChart3, 
  Download,
  CheckCircle2
} from "lucide-react";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // 1. Resolve date range (default to last 7 days)
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : new Date();
  if (!params.from) {
    from.setDate(to.getDate() - 7);
  }
  
  // Set time for inclusive range
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  // 2. Fetch REAL watering data from Prisma
  const wateringLogs = await prisma.wateringLog.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 3. Aggregate Summary Data
  const summary = {
    totalWaterUsed: wateringLogs.reduce((acc, log) => acc + (log.waterAmountMl || 0), 0),
    totalEvents: wateringLogs.length,
    avgMoisture: wateringLogs.length > 0 
      ? wateringLogs.reduce((acc, log) => acc + (log.moistureBefore || 0), 0) / wateringLogs.length 
      : 0
  };

  // 4. Dynamic Grouping by Date for Charts
  const dailyData: Record<string, { moistureSum: number; moistureCount: number; waterAmount: number }> = {};
  
  // Generate all dates in range
  const current = new Date(from);
  while (current <= to) {
    const dateStr = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[dateStr] = { moistureSum: 0, moistureCount: 0, waterAmount: 0 };
    current.setDate(current.getDate() + 1);
  }

  wateringLogs.forEach(log => {
    if (log.createdAt) {
      const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData[dateStr]) {
        if (log.moistureBefore !== null) {
          dailyData[dateStr].moistureSum += log.moistureBefore;
          dailyData[dateStr].moistureCount += 1;
        }
        dailyData[dateStr].waterAmount += (log.waterAmountMl || 0);
      }
    }
  });

  const moistureTrend = Object.entries(dailyData).map(([date, data]) => ({
    date,
    moisture: data.moistureCount > 0 ? Math.round(data.moistureSum / data.moistureCount) : 0
  }));

  const waterUsage = Object.entries(dailyData).map(([date, data]) => ({
    date,
    amount: data.waterAmount
  }));

  const analyticsData = {
    summary,
    moistureTrend,
    waterUsage
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">Dashboard Analytics</h2>
          <p className="text-[#757575] mt-1">Real-time hydration intelligence and resource metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0E6633] text-white rounded-xl text-sm font-bold hover:bg-[#0c592b] transition-all shadow-md shadow-[#0E6633]/20">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md rounded-3xl p-1 border border-white shadow-xl">
        <div className="bg-[#fcfdfc] rounded-[22px] p-8">
          <AnalyticsCharts data={analyticsData} />
        </div>
      </div>

    </div>
  );
}
