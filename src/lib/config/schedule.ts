function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `Env var ${name} must be an integer between ${min} and ${max}, received: ${raw}`
    );
  }
  return parsed;
}

function parseTimezoneEnv(name: string, fallback: string): string {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: raw });
  } catch {
    throw new Error(`Env var ${name} is not a valid IANA timezone: ${raw}`);
  }
  return raw;
}

export type ScheduleConfig = {
  midDayHour: number;
  midDayMinute: number;
  endOfDayHour: number;
  endOfDayMinute: number;
  timezone: string;
};

export const ORG_TIMEZONE = parseTimezoneEnv("OGGI_ORG_TIMEZONE", "Europe/Rome");
export const MID_DAY_HOUR = parseIntEnv("OGGI_MID_DAY_HOUR", 12, 0, 23);
export const MID_DAY_MINUTE = parseIntEnv("OGGI_MID_DAY_MINUTE", 30, 0, 59);
export const END_OF_DAY_HOUR = parseIntEnv("OGGI_END_OF_DAY_HOUR", 18, 0, 23);
export const END_OF_DAY_MINUTE = parseIntEnv("OGGI_END_OF_DAY_MINUTE", 0, 0, 59);

export const scheduleConfig: ScheduleConfig = {
  midDayHour: MID_DAY_HOUR,
  midDayMinute: MID_DAY_MINUTE,
  endOfDayHour: END_OF_DAY_HOUR,
  endOfDayMinute: END_OF_DAY_MINUTE,
  timezone: ORG_TIMEZONE,
};

export function formatMidDayLabel(config: ScheduleConfig = scheduleConfig): string {
  const hh = String(config.midDayHour).padStart(2, "0");
  const mm = String(config.midDayMinute).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatEndOfDayLabel(config: ScheduleConfig = scheduleConfig): string {
  const hh = String(config.endOfDayHour).padStart(2, "0");
  const mm = String(config.endOfDayMinute).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function endOfDayMinutes(config: ScheduleConfig): number {
  return config.endOfDayHour * 60 + config.endOfDayMinute;
}

export function midDayMinutes(config: ScheduleConfig): number {
  return config.midDayHour * 60 + config.midDayMinute;
}
