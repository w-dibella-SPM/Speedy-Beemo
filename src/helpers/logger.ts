import fs from "fs";
import path from "node:path";
import { BASE_DIR } from "../const";
import {appendFileSync} from "node:fs";

interface ILogger {
    info(...data: unknown[]): void;
    error(...data: unknown[]): void;
}

const LOGS_DIRECTORY = path.join(BASE_DIR, "logs");
const INFO_LOG_FILE_NAME = "run";
const ERROR_LOG_FILE_NAME = "error";

export class Logger implements ILogger {
    private static instance: Logger;

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private readonly executionTimestamp: string;
    private readonly infoFilePath: string;
    private readonly errorFilePath: string;

    private constructor() {
        this.executionTimestamp = new Date().toISOString().replace(":", "-");
        this.infoFilePath = path.join(LOGS_DIRECTORY, INFO_LOG_FILE_NAME, `${INFO_LOG_FILE_NAME}-${this.executionTimestamp}.log`);
        this.errorFilePath = path.join(LOGS_DIRECTORY, ERROR_LOG_FILE_NAME, `${ERROR_LOG_FILE_NAME}-${this.executionTimestamp}.log`);

        fs.mkdirSync(path.join(LOGS_DIRECTORY, INFO_LOG_FILE_NAME), { recursive: true });
        fs.mkdirSync(path.join(LOGS_DIRECTORY, ERROR_LOG_FILE_NAME), { recursive: true });
    }

    info(...data: unknown[]): void {
        const msg = this.buildMessage(data);
        console.info(msg);
        this.appendToFile(this.infoFilePath, msg);
    }

    error(...data: unknown[]): void {
        const msg = this.buildMessage(data);
        console.error(msg);
        this.appendToFile(this.errorFilePath, msg);
    }

    private buildMessage<T extends unknown[]>(data: T): [string, T] {
        return [`[${new Date().toLocaleString()}]`, data];
    }

    private appendToFile(filePath: string, msg: [string, unknown[]]): void {
        const [ timestamp, data ] = msg;
        const dataToString = data
            .map(d => {
                if (d instanceof Error) {
                    return JSON.stringify(d, Object.getOwnPropertyNames(d), 2);
                }

                return d !== null && typeof d === "object"
                    ? JSON.stringify(d, null, 2)
                    : String(d)
                }
            )
            .join(" ");

        fs.appendFileSync(filePath, `${timestamp} ${dataToString}\n`);
    }
}