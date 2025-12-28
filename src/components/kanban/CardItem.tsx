import { AlignLeft, Calendar, CalendarX2 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CardType } from "@/types/api";

const DAY_MS = 1000 * 60 * 60 * 24;
const DUE_WINDOW_DAYS = 30;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// 날짜를 해당 날짜의 끝(23:59:59)으로 보정
const toLocalEndOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// 마감 임박 진행률 계산
const getScheduleStats = (dueDate: string | null) => {
  if (!dueDate) return null;

  const end = toLocalEndOfDay(new Date(dueDate)).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((end - now) / DAY_MS);
  const progress =
    diffDays < 0
      ? 100
      : clamp(((DUE_WINDOW_DAYS - diffDays) / DUE_WINDOW_DAYS) * 100, 0, 100);
  return { diffDays, progress };
};

export function CardItem({ card }: { card: CardType }) {
  const [isPressed, setIsPressed] = useState(false);
  const dDayStats = getScheduleStats(card.dueDate);
  const hasDescription = Boolean(card.description?.trim());

  return (
    <Card
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={cn(
        "group flex min-h-[120px] cursor-pointer flex-col border-none bg-white shadow-sm transition-all duration-150 hover:shadow-md hover:ring-2 dark:bg-slate-800",
        isPressed && "translate-y-px scale-[0.99]",
        hasDescription
          ? "hover:bg-primary/5 hover:ring-primary/25 dark:hover:bg-primary/10"
          : "hover:ring-primary/10"
      )}
    >
      <CardHeader className="px-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-1.5">
            <CardTitle className="line-clamp-2 font-bold text-foreground/90 text-sm leading-snug">
              {card.title}
            </CardTitle>
            {hasDescription ? (
              <AlignLeft
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                aria-label="상세 내용 있음"
              />
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between gap-3 font-medium text-[11px] text-muted-foreground/60">
            <div className="flex items-center gap-1.5">
              {card.dueDate ? (
                <Calendar className="h-3 w-3" />
              ) : (
                <CalendarX2 className="h-3 w-3" />
              )}
              <span>
                {card.dueDate
                  ? new Date(card.dueDate).toLocaleDateString("ko-KR")
                  : "완료일 없음"}
              </span>
            </div>

            {dDayStats && (
              <div className="flex items-center gap-1.5 font-bold text-[10px]">
                <span
                  className={cn(
                    dDayStats.diffDays <= 3
                      ? "text-destructive"
                      : "text-primary"
                  )}
                >
                  {dDayStats.diffDays < 0
                    ? "마감 지남"
                    : `D-${dDayStats.diffDays}`}
                </span>
                <span className="text-muted-foreground/70">·</span>
                <span className="text-muted-foreground">
                  임박도 {Math.round(dDayStats.progress)}%
                </span>
              </div>
            )}
          </div>

          {dDayStats ? (
            <Progress value={dDayStats.progress} className="h-1" />
          ) : (
            <div className="h-1" aria-hidden />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
