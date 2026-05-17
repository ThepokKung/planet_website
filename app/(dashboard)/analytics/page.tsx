import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { TimeRangeDropdown } from "@/components/time-range-dropdown";
import { 
  BarChart3, 
  CheckCircle2,
  Filter
} from "lucide-react";
import { getAccessibleData } from "@/lib/data-access";
import { AnalyticsFilters } from "@/components/analytics-filters";
import { PageHeader } from "@/components/page-header";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; robots?: string; zone?: string }>;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { zones, robots: allAccessibleRobots } = await getAccessibleData();

  const selectedRobotIds = params.robots?.split(',').filter(Boolean) || [];
  const selectedZoneId = params.zone;

  // 1. Determine target robots based on zone filter
  let robotsInScope = allAccessibleRobots;
  if (selectedZoneId && selectedZoneId !== 'all') {
    robotsInScope = allAccessibleRobots.filter(r => r.locationId === selectedZoneId);
  }

  // 2. Resolve date range (default to last 7 days)
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : new Date();
  if (!params.from) {
    from.setDate(to.getDate() - 7);
  }

  // Set time for inclusive range
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  // 3. Fetch REAL watering data from Prisma
  const wateringLogs = await prisma.wateringLog.findMany({
    where: {
      robotId: {
        in: selectedRobotIds.length > 0 
          ? selectedRobotIds 
          : robotsInScope.map(r => r.id).filter((id): id is string => !!id)
      },
      createdAt: {
        gte: from,
        lte: to
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      moistureBefore: true,
      waterAmountMl: true,
    },
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
      <PageHeader 
        title="Dashboard Analytics"
        description="Real-time hydration intelligence and resource metrics"
      >
        <TimeRangeDropdown />
        <DateRangePicker />
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-[#1e1e1e] flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-[#0E6633]" /> Analytics Filters
            </h3>
            <div className="space-y-6">
              <AnalyticsFilters zones={zones} robots={allAccessibleRobots} />
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-[#757575] uppercase tracking-widest mb-2">Selection Info</p>
                <p className="text-xs text-[#1e1e1e] font-medium leading-relaxed">
                  {selectedRobotIds.length === 0 
                    ? `Showing data for all ${robotsInScope.length} robots in the current selection.` 
                    : `Analyzing performance for ${selectedRobotIds.length} selected robot(s).`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <AnalyticsCharts data={analyticsData} />
          </div>
        </div>
      </div>
    </div>
  );
}
