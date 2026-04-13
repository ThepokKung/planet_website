import { prisma } from "@/lib/prisma";
import { RobotDetailsList } from "@/components/robot-details-list";
import { getSession } from "@/lib/session";

export default async function DetailsPage() {
  const session = await getSession();
  const userRole = session?.role as string | undefined;

  const robots = await prisma.robot.findMany({
    include: {
      pots: {
        include: { plants: true }, // Include nested plants
        orderBy: { trackIndex: 'asc' }
      }
    },
    orderBy: { id: 'asc' }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-[#1e1e1e]">Robot Details</h2>
        <p className="text-[#757575] mt-1">Hierarchical view of your robot dashboard</p>
      </div>

      <RobotDetailsList robots={robots} role={userRole} />
    </div>
  );
}
