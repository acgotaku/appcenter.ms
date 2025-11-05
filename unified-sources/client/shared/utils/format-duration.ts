import { t } from "@root/lib/i18n";

export function formatDuration(period: number, short: boolean = false): string {
  const totalSeconds = Math.max(Math.floor(period / 1000), 0);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  if (short) {
    const twoDigitMins = minutes < 10 ? `0${minutes}` : String(minutes);
    const twoDigitSecs = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${twoDigitMins}:${twoDigitSecs}`;
  }

  if (minutes > 0 && seconds > 0) {
    return t("common:dateTime.duration.abbreviated.minutesAndSeconds", { minutes, seconds });
  } else if (minutes > 0) {
    return t("common:dateTime.duration.abbreviated.minutes", { minutes });
  } else {
    return t("common:dateTime.duration.abbreviated.seconds", { seconds });
  }
}
