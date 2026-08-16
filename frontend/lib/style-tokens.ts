/**
 * RPG / ミニマル両テーマで繰り返し使う見た目のTailwindユーティリティクラス片。
 * mock (materials/dot_rpg_minimal_pomodoro_timer.html) の
 * .dq-box / .dq-box-sm / .glass-card / .glass-button をTailwindユーティリティの
 * 組み合わせとして再現する (CSS-in-JSやインラインstyleは使わない)。
 */

/** DQ風の太い2重ボーダーボックス (mockの.dq-box相当)。 */
export const DQ_BOX = "border-4 border-white bg-black shadow-[0_0_0_4px_#000000,0_0_0_8px_#ffffff]";

/** DQ風の細い2重ボーダーボックス (mockの.dq-box-sm相当)。 */
export const DQ_BOX_SM = "border-2 border-white bg-black shadow-[0_0_0_2px_#000000,0_0_0_4px_#ffffff]";

/** ガラス風カード (mockの.glass-card相当)。 */
export const GLASS_CARD =
  "rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-2xl transition-all duration-300 hover:border-white/15";

/** ガラス風ボタン (mockの.glass-button相当)。 */
export const GLASS_BUTTON =
  "rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.12] active:translate-y-0";

/** ミニマルテーマの背景グラデーション (mockの.theme-minimal相当)。 */
export const MINIMAL_BACKGROUND = "bg-[radial-gradient(circle_at_50%_20%,_#1a1c29_0%,_#0a0b10_100%)]";
