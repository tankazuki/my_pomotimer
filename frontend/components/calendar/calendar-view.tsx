"use client";

import { useState } from "react";

import { DayDetailPanel } from "@/components/calendar/day-detail-panel";
import { MonthGrid } from "@/components/calendar/month-grid";
import { useMonthStats } from "@/components/calendar/use-month-stats";
import { useDayDetail } from "@/hooks/use-day-detail";
import { useTheme } from "@/hooks/use-theme";
import { formatDateYYYYMMDD } from "@/lib/date";
import { DQ_BOX, DQ_BOX_SM, GLASS_BUTTON, GLASS_CARD } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" });

type MonthCursor = { year: number; month: number };

function startOfMonth(year: number, month: number): MonthCursor {
  const normalized = new Date(year, month, 1);
  return { year: normalized.getFullYear(), month: normalized.getMonth() };
}

function monthIndex(cursor: MonthCursor): number {
  return cursor.year * 12 + cursor.month;
}

export function CalendarView() {
  const { theme } = useTheme();
  const isRpg = theme === "rpg";

  const now = new Date();
  const todayDateStr = formatDateYYYYMMDD(now);

  const [cursor, setCursor] = useState<MonthCursor>(() =>
    startOfMonth(now.getFullYear(), now.getMonth()),
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  const { statsByDate, isLoading: isMonthLoading, error: monthError } = useMonthStats(
    cursor.year,
    cursor.month,
  );
  const dayDetail = useDayDetail(selectedDate);

  function goToMonth(nextCursor: MonthCursor, dir: 1 | -1): void {
    setDirection(dir);
    setCursor(nextCursor);
  }

  function handlePrevMonth(): void {
    goToMonth(startOfMonth(cursor.year, cursor.month - 1), -1);
  }

  function handleNextMonth(): void {
    goToMonth(startOfMonth(cursor.year, cursor.month + 1), 1);
  }

  function handleToday(): void {
    const today = new Date();
    const target = startOfMonth(today.getFullYear(), today.getMonth());
    setDirection(monthIndex(target) >= monthIndex(cursor) ? 1 : -1);
    setCursor(target);
    setSelectedDate(formatDateYYYYMMDD(today));
  }

  const monthLabel = MONTH_LABEL_FORMATTER.format(new Date(cursor.year, cursor.month, 1));

  const navButtonClass = isRpg
    ? cn(DQ_BOX_SM, "px-3 py-1.5 text-xs font-semibold text-white hover:bg-white hover:text-black")
    : cn(GLASS_BUTTON, "px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white");

  return (
    <main className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <div className={cn(isRpg ? DQ_BOX : GLASS_CARD, "flex flex-col gap-4 p-4 md:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-white">{monthLabel}</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrevMonth} className={navButtonClass}>
              前月
            </button>
            <button type="button" onClick={handleToday} className={navButtonClass}>
              今月
            </button>
            <button type="button" onClick={handleNextMonth} className={navButtonClass}>
              翌月
            </button>
          </div>
        </div>

        {monthError ? <p className="text-sm text-red-400">{monthError}</p> : null}

        <MonthGrid
          theme={theme}
          year={cursor.year}
          month={cursor.month}
          statsByDate={statsByDate}
          selectedDate={selectedDate}
          todayDate={todayDateStr}
          direction={direction}
          onSelectDate={setSelectedDate}
        />

        {isMonthLoading && <p className="text-center text-xs text-gray-400">月間データを読み込み中...</p>}
      </div>

      <DayDetailPanel
        theme={theme}
        dateStr={selectedDate}
        data={dayDetail.data}
        isLoading={dayDetail.isLoading}
        error={dayDetail.error}
      />
    </main>
  );
}
