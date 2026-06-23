import { captureUnexpected } from "@/lib/capture-unexpected";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function emit(level: "info" | "warn" | "error", event: string, fields?: LogFields) {
  const payload = { level, event, ts: new Date().toISOString(), ...fields };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  info(event: string, fields?: LogFields) {
    emit("info", event, fields);
  },
  warn(event: string, fields?: LogFields) {
    emit("warn", event, fields);
  },
  error(event: string, fields?: LogFields, err?: unknown) {
    emit("error", event, fields);
    if (err !== undefined) {
      captureUnexpected(err, event, fields);
    }
  },
};
