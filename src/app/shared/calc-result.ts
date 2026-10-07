export type Tone = 'success' | 'warn' | 'danger';
export type ResultIcon = 'check' | 'warn' | 'x' | 'up' | 'down' | 'flat';
export type PremiumDirection = 'increase' | 'decrease' | 'flat';

/** One run of text in a result message. Strong runs are rendered in a <strong>. */
export interface BodySegment {
  text: string;
  strong?: boolean;
}

export type BodyParagraph = BodySegment[];

/** What a calculator hands to the UI. The calculators decide the content, the templates decide the markup. */
export interface CalcResult {
  tone: Tone;
  icon: ResultIcon;
  title: string;
  copyText?: string;
  body?: BodyParagraph[];
  tileNum?: number;
  tileLabel?: string;
  badge?: string;
  meta?: string;
  extraMeta?: string;
  premiumPct?: string;
  premiumClass?: PremiumDirection;
}

export const plain = (text: string): BodySegment => ({ text });
export const strong = (text: string): BodySegment => ({ text, strong: true });
