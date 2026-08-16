import { DQ_BOX } from "@/lib/style-tokens";

type StatusWindowProps = {
  level: number;
  todayCount: number;
  totalCount: number;
};

function HeroIcon() {
  return (
    <svg className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 2h10v2H7V2zm-2 4h14v2H5V6zm0 4h14v2H5v-2zm2 4h10v2H7v-2zm-2 4h14v2H5v-2zm2 4h10v2H7v-2z" />
      <circle cx="9" cy="8" r="1.5" fill="#eab308" />
      <circle cx="15" cy="8" r="1.5" fill="#eab308" />
    </svg>
  );
}

/** RPGテーマ左カラムのヒーローステータス表示。 */
export function StatusWindow({ level, todayCount, totalCount }: StatusWindowProps) {
  return (
    <div className={`${DQ_BOX} p-4 text-white`}>
      <div className="mb-3 flex items-center justify-between border-b-2 border-white pb-2">
        <span className="text-lg text-yellow-300">ステータス</span>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-white bg-gray-900 motion-safe:animate-bounce">
          <HeroIcon />
        </div>
        <div>
          <div className="text-xl">
            {"ゆうしゃ (Lv."}
            {level}
            {")"}
          </div>
          <div className="mt-1 text-sm text-gray-300">
            {"しゅうちゅうりょく: "}
            <span className="text-green-400">MAX</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>きょうの ポモドーロ:</span>
          <span className="font-bold text-yellow-300">
            {"🍅 x "}
            {todayCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span>ぜんたいの ポモドーロ:</span>
          <span className="font-bold text-yellow-300">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
