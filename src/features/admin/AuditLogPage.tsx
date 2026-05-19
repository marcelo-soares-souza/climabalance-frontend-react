import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log";
import { Card, CardContent } from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

export function AuditLogPage() {
  const { t } = useTranslation();
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [offset, setOffset] = useState(0);

  const { data: entries, isLoading } = useQuery({
    queryKey: [
      "audit-log",
      {
        actor_email: actorFilter || undefined,
        action: actionFilter || undefined,
        client_ip: ipFilter || undefined,
        offset,
      },
    ],
    queryFn: () =>
      auditLogService.listAuditLog({
        actor_email: actorFilter || undefined,
        action: actionFilter || undefined,
        client_ip: ipFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: (prev) => prev,
  });

  const currentPage = offset / PAGE_SIZE + 1;
  const hasPrevious = offset > 0;
  const hasNext = entries != null && entries.length >= PAGE_SIZE;

  return (
    <>
      <SEO title={t("seo.adminAuditLog.title")} />
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("admin.auditLog.title")}</h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-[var(--radius-input)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t("admin.auditLog.filterActor")}
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-[var(--radius-input)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t("admin.auditLog.filterAction")}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-[var(--radius-input)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t("admin.auditLog.filterIp")}
              value={ipFilter}
              onChange={(e) => {
                setIpFilter(e.target.value);
                setOffset(0);
              }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading && !entries ? (
              <div className="p-4">
                <SkeletonTable rows={10} cols={6} />
              </div>
            ) : entries && entries.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.timestamp")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.actor")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.action")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.entity")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.ip")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      {t("admin.auditLog.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">{entry.actorEmail ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge>{entry.action}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {entry.entityType}/{entry.entityId?.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {entry.clientIp ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.success ? "success" : "error"}>
                          {entry.success
                            ? t("common.ok")
                            : `${entry.httpStatus}`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={<Shield className="h-12 w-12" />}
                  title={t("admin.auditLog.empty")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {t("admin.auditLog.page", { page: currentPage })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevious}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("admin.auditLog.prev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            >
              {t("admin.auditLog.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
