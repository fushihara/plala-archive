import { createLogger, format, transports } from "winston";
import WinstonDailyRotateFile from "winston-daily-rotate-file"
const timestampFormat = format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
});
const errorFormat = format.errors({ stack: true });
function getFormat(colorize: boolean) {
  const f = format.combine(
    timestampFormat,
    errorFormat,
    ...(() => {
      if (colorize) {
        return [format.colorize({ all: true })];
      } else {
        return []
      }
    })(),
    format.printf(
      (info) => {
        let r = [
          `[${info.timestamp}]`,
          `[${String(info.loggerName ?? "Default").padStart(7)}]`,
          `[${info.level.padStart(5)}] ${info.message}`
        ].join("");
        if (info.stack) {
          r += `\n${info.stack}`;
        }
        return r;
      },
    ),
  );
  return f;
}
const logger = createLogger({
  level: "debug",
  defaultMeta: {},
  format: errorFormat,
  transports: [
    new WinstonDailyRotateFile({
      datePattern: "YYYY-MM-DD", // YYYY-MM-DD_HH-mm
      filename: "log-%DATE%.txt",
      dirname: ".logs",
      format: getFormat(false),
    }),
    new transports.Console({
      format: getFormat(true),
    }),
  ],
});
export function getLogger(loggerName?: string) {
  const newLogger = logger.child({ "loggerName": loggerName });
  return newLogger;
}
/*
const logger2 = getLogger()
const logger3 = getLogger("level3")
logger.debug("こちらルートロガー のデバッグ");
logger.info("こちらルートロガー");
logger2.info("こちらレベル2");
logger3.info("こちらレベル3");
logger.error(new Error("エラーオブジェクトより"));
*/