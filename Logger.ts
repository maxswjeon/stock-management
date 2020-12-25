import winston from 'winston';

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json(),
        }),
        new winston.transports.File({
            filename: 'logs/access.log',
            level: 'info',
            format: winston.format.json(),
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            )
        })
    ]
});

export default logger;