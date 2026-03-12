import { cn } from "@/lib/cn";
import { Text } from "@/app/components/text";
import { Tooltip } from "@/app/components/tooltip";
import { TagBadge } from "@/app/components/tag-badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/app/components/collapsible";
import type { HistoryDay } from "@/lib/queries/history";
import { formatLongDate, formatShortDate } from "@/lib/dates/format";

const statusBase = "w-5 h-5 flex items-center justify-center shrink-0 text-small font-semibold";
const badge = "text-tag font-medium px-2 py-0.5 rounded-full bg-border text-muted whitespace-nowrap";
const badgeCarryOver = "text-tag font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap";

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <span className={`${statusBase} text-accent`}>✓</span>;
  }
  if (status === "SKIPPED") {
    return <span className={`${statusBase} text-amber-800`}>↗</span>;
  }
  return <span className={`${statusBase} text-muted`}>—</span>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "text-muted transition-transform duration-200 shrink-0",
        open && "rotate-180"
      )}
      aria-hidden="true"
    >
      <path d="M3.5 5.25 7 8.75l3.5-3.5" />
    </svg>
  );
}

type HistoryDayCardProps = {
  day: HistoryDay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HistoryDayCard({ day, open, onOpenChange }: HistoryDayCardProps) {
  const pct = Math.round(day.stats.completionRate * 100);

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange}>
      <section className="mt-8 pb-6 border-b-2 border-border">
        <Text as="h2" variant="heading" className="capitalize">
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between text-left cursor-pointer bg-transparent border-0 p-0">
              <span>{formatLongDate(new Date(day.date))}</span>
              <div className="flex items-center gap-2">
                <span className="text-small text-muted font-medium font-body">
                  {day.stats.completed}/{day.stats.total} · {pct}%
                </span>
                <ChevronIcon open={open} />
              </div>
            </button>
          </CollapsibleTrigger>
        </Text>

        <CollapsibleContent>
          <div className="flex flex-col mt-3">
            {day.tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-2 border-b border-border">
                <StatusIcon status={task.status} />

                <div className="flex-1 min-w-0">
                  <span
                    className={cn("text-body leading-[1.4]", task.status === "COMPLETED" && "line-through opacity-50")}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {task.tags?.map(tag => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {task.sourceType === "RECURRING" && (
                    <Tooltip content="Recurring task">
                      <span className={badge} tabIndex={0}>
                        ↻
                      </span>
                    </Tooltip>
                  )}
                  {task.status === "SKIPPED" &&
                    task.originalDate === null && (
                      <Tooltip content="Carried over to the next day">
                        <span className={badgeCarryOver} tabIndex={0}>
                          ↗
                        </span>
                      </Tooltip>
                    )}
                  {task.originalDate &&
                    task.originalDate !== task.scheduledDate && (
                      <Tooltip content={`Originally on ${formatShortDate(task.originalDate)}`}>
                        <span className={badgeCarryOver} tabIndex={0}>
                          ↗ {formatShortDate(task.originalDate)}
                        </span>
                      </Tooltip>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
