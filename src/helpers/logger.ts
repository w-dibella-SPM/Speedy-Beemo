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
        this.executionTimestamp = new Date().toISOString().replaceAll(":", "-");
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
        console.error(
            msg[0],
            msg[1].map(data => data instanceof Error ? data.message : data)
        );
        this.appendToFile(this.errorFilePath, msg);
    }

    private buildMessage<T extends unknown[]>(data: T): [string, T] {
        const sanitizedData = data.map(d => {
            if (d instanceof Error || typeof d !== "object" || d === null) return d;

            const dCopy = { ...d };
            for (const key of Object.keys(dCopy)) {
                if (key.match(/password/i)) {
                    // @ts-ignore
                    dCopy[key] = "*".repeat(12);
                }
            }
            return dCopy;
        }) as T;
        
        return [`[${new Date().toLocaleString()}]`, sanitizedData];
    }

    private appendToFile(filePath: string, msg: [string, unknown[]]): void {
        const [ timestamp, data ] = msg;
        const dataToString = data
            .map(d => {
                if (d instanceof Error) {
                    return JSON.stringify(d, Object.getOwnPropertyNames(d), 2);
                }

                if (d === null || typeof d !== "object") return String(d);

                return JSON.stringify(d, null, 2);
            })
            .join(" ");

        fs.appendFileSync(filePath, `${timestamp} ${dataToString}\n`);
    }
}