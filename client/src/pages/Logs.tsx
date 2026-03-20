import { useGlucoseLogs } from "@/hooks/use-glucose-logs";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Logs() {
  const { data: logs, isLoading } = useGlucoseLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-primary">Logs History</h1>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground/80">
                    {format(new Date(log.measuredAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-lg font-bold text-primary">
                    {log.value} <span className="text-xs font-normal text-muted-foreground">mg/dL</span>
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium text-secondary-foreground">
                      {log.type.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">
                    {log.source === 'ocr' ? 'Auto-Scan' : 'Manual'}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.isConfirmed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No logs found. Add your first reading!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
