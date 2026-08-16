"use client";

import { useMemo, useState } from "react";

import { DailyBarChart } from "@/components/stats/daily-bar-chart";
import { DayBreakdownList } from "@/components/stats/day-breakdown-list";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { useTheme } from "@/hooks/use-theme";
import { formatDateYYYYMMDD } from "@/lib/date";
import { formatMinutesJa } from "@/lib/format-minutes";
import { playClickSound } from "@/lib/sound";
import { DQ_BOX, DQ_BOX_SM, GLASS_BUTTON, GLASS_CARD } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { days: 7, label: "7日間" },
  { days: 30, label: "30日間" },
  { days: 90, label: "90日間" },
] as const;

type SummaryStatProps = {
  label: string;
  value: string;
  isRpg: boolean;
};

function SummaryStat({ label, value, isRpg }: SummaryStatProps) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{label}</div>
      <div className={cn("mt-1 text-xl font-bold", isRpg ? "text-yellow-300" : "text-orange-400")}>
        {value}
      </div>
    </div>
  );
}

/**
 * 統計画面本体。RPG/ミニマル両テーマで共通の実装 (トークン・条件分岐でスキンのみ切り替える)。
 */
export function StatsView() {
  const { theme } = useTheme();
  const isRpg = theme === "rpg";
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [manualSelectedDate, setManualSelectedDate] = useState<string | null>(null);
  const { data, isLoading, error, refresh } = useDailyStats(rangeDays);

  // 選択中の日が現在のデータ範囲に含まれていればそれを維持し、含まれていなければ
  // 「本日」(なければ最新日) を表示する。effectではなく描画時に導出する。
  const selectedDate = useMemo(() => {
    if (!data) return null;
    if (manualSelectedDate && data.days.some((day) => day.date === manualSelectedDate)) {
      return manualSelectedDate;
    }
    const todayStr = formatDateYYYYMMDD(new Date());
    if (data.days.some((day) => day.date === todayStr)) return todayStr;
    return data.days.at(-1)?.date ?? null;
  }, [data, manualSelectedDate]);

  const selectedDay = data?.days.find((day) => day.date === selectedDate) ?? null;

  return (
    <main className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">統計</h2>
        <div className={cn("flex gap-1 p-1", isRpg ? DQ_BOX_SM : cn(GLASS_CARD, "rounded-xl"))}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => {
                playClickSound();
                setRangeDays(option.days);
              }}
              aria-pressed={rangeDays === option.days}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                rangeDays === option.days
                  ? isRpg
                    ? "bg-yellow-400 text-black"
                    : "bg-orange-500 text-white"
                  : "text-gray-300 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className={cn(isRpg ? DQ_BOX_SM : GLASS_CARD, "p-6 text-center text-sm text-red-300")}>
          <p>統計データの取得に失敗しました: {error}</p>
          <button
            type="button"
            onClick={refresh}
            className={cn(GLASS_BUTTON, "mt-3 px-4 py-1.5 text-xs font-semibold text-white")}
          >
            再試行
          </button>
        </div>
      ) : isLoading || !data ? (
        <div className={cn(isRpg ? DQ_BOX_SM : GLASS_CARD, "p-10 text-center text-sm text-gray-400")}>
          読み込み中...
        </div>
      ) : (
        <>
          <div className={cn(isRpg ? DQ_BOX : GLASS_CARD, "grid grid-cols-1 gap-4 p-5 sm:grid-cols-3")}>
            <SummaryStat
              label="合計作業時間"
              value={formatMinutesJa(data.totals.work_minutes)}
              isRpg={isRpg}
            />
            <SummaryStat
              label="完了ポモドーロ数"
              value={`${data.totals.completed_work_sessions} 回`}
              isRpg={isRpg}
            />
            <SummaryStat label="活動日数" value={`${data.totals.active_days} 日`} isRpg={isRpg} />
          </div>

          <div className={cn(isRpg ? DQ_BOX : GLASS_CARD, "p-5")}>
            {data.totals.active_days === 0 && (
              <p className="mb-3 text-center text-xs text-gray-400">
                この期間の作業記録はまだありません。棒をクリックすると日別の内訳を確認できます。
              </p>
            )}
            <DailyBarChart
              days={data.days}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                playClickSound();
                setManualSelectedDate(date);
              }}
              isRpg={isRpg}
            />
          </div>

          <DayBreakdownList day={selectedDay} isRpg={isRpg} />
        </>
      )}
    </main>
  );
}
