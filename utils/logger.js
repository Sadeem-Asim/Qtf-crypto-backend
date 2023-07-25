import winston, {format} from "winston";

import {envConfig} from "#utils/common/env";

const today = new Date()
const filename = today.toISOString().split('T')[0] + '.log';
const customFormat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
    format.colorize(),
    format.align(),
    format.printf(info => `Date: ${info.timestamp} ### ${info.message}`)
)

export const myLogger = {
    kucoin: winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/kucoin/${filename}`,
            // format: customFormat,
        })],
    }),
    binance: winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/binance/${filename}`,
            // format: customFormat
        })],
    }),
    transaction: winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/transaction/${filename}`,
            // format: customFormat
        })],
    }),
    binanceTesting:   winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/debugging/binance/${filename}`,
            format: customFormat
        })],
    }),
    kucoinTesting:   winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/debugging/kucoin/${filename}`,
            format: customFormat
        })],
    }),
    kucoinError: winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/errors/kucoin/${filename}`,
            format: customFormat
        })],
    }),
    binanceError: winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.json(),
        transports: [new winston.transports.File({
            filename: `logs/errors/binance/${filename}`,
            format: customFormat
        })],
    }),
}

const logger = () => {
    envConfig();
    /*winston.add(
        new winston.transports.File({
            filename: 'logs/transactions.log',
            level: 'warn',
            format: format.combine(
                // format.timestamp(), format.json()
                format.timestamp(),
                format.prettyPrint(),
                format.colorize(),
                format.align(),
                format.printf(info => `${info.timestamp} - ${info.message}`)
            ),
        })
    )
    winston.add(
        new winston.transports.File({
            filename: 'logs/binance.log',
            level: 'debug',
            format: format.combine(
                // format.timestamp(), format.json()
                format.timestamp({
                    format: 'HH-MM:ss YYYY-MM-DD'
                }),
                format.prettyPrint(),
                format.colorize(),
                format.align(),
                format.printf(info => `${info.timestamp} - ${info.message}`)
            ),
        })
    )

    winston.add(
        new winston.transports.File({
            filename: 'logs/log_file.log',
            level: 'error',
            format: format.combine(
                // format.timestamp(), format.json()
                format.timestamp({
                    format: 'HH-MM:ss YYYY-MM-DD'
                }),
                // format.prettyPrint(),
                // format.colorize(),
                // format.align(),
                format.printf(info => `[TIME:${info.timestamp}] - [TYPE:${info.level}] - [MESSAGE:${info.message}] - [STACK: ${info.stack}]`)
            ),
        })
    )
    /!*winston.add(
        new winston.transports.Console({
            colorize: true,
            format: format.combine(
                winston.format.simple(),
                winston.format.colorize(),
            ),
        })
    )*!/
    winston.add(new winston.transports.MongoDB({
        options: {useUnifiedTopology: true},
        db: getEnv('MONGO_URI'),
        level: 'error',
        format: format.combine(
            format.errors({stack: true}),
            format.timestamp({format: 'HH-MM:ss YYYY-MM-DD'}),
            format.metadata()
        ),
    }));*/
    /*For Handling uncaughtException*/
    winston.exceptions.handle(
        // new winston.transports.Console({colorize: true, prettyPrint: true}),
        new winston.transports.File({filename: 'logs/uncaughtException.log'}))

    process.on("uncaughtException", (error) => {
        console.log("\x1b[31m%s", error);
    })
}

export default logger
