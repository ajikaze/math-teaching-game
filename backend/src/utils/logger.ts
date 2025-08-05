// backend/src/utils/logger.ts
interface LogLevel {
    INFO: number;
    WARN: number;
    ERROR: number;
    DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

class Logger {
    private currentLevel: number;

    constructor() {
        const envLevel = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
        this.currentLevel =
            LOG_LEVELS[envLevel as keyof LogLevel] || LOG_LEVELS.INFO;
    }

    private formatMessage(level: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const baseMessage = `[${timestamp}] ${level}: ${message}`;

        if (data) {
            return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
        }

        return baseMessage;
    }

    private shouldLog(level: number): boolean {
        return level >= this.currentLevel;
    }

    debug(message: string, data?: any): void {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatMessage("DEBUG", message, data));
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatMessage("INFO", message, data));
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            console.warn(this.formatMessage("WARN", message, data));
        }
    }

    error(message: string, data?: any): void {
        if (this.shouldLog(LOG_LEVELS.ERROR)) {
            console.error(this.formatMessage("ERROR", message, data));
        }
    }
}

export const logger = new Logger();
