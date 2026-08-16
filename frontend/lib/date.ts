/**
 * 日付関連の純粋関数群。統計・カレンダー画面から共通で使う。
 */

/** ブラウザのタイムゾーンオフセット (分。UTCより東ならプラス)。バックエンドの tz_offset_minutes に渡す。 */
export function getTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** ローカル日付を "YYYY-MM-DD" 形式に整形する (UTC変換はしない)。 */
export function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAYS_IN_WEEK = 7;
const WEEKS_IN_GRID = 6;

/**
 * 指定した年月 (month は 0始まり) のカレンダーグリッド用の日付配列を返す。
 * 前後月の日を含め、日曜始まりの週で6週間 (42日) 分を返す
 * (月をまたいでも高さが変わらないグリッドにしやすいため)。
 */
export function getMonthDates(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  const dates: Date[] = [];
  for (let i = 0; i < DAYS_IN_WEEK * WEEKS_IN_GRID; i++) {
    dates.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return dates;
}
