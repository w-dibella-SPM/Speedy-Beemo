import fs from "fs";
import path from "node:path";
import { BASE_DIR } from "../const";

interface ILogger {
    info(...data: unknown[]): void;
    error(...data: unknown[]): void;
}

const LOGS_DIRECTORY = path.join(BASE_DIR, "logs");
const INFO_LOG_FILE_NAME = "run";
const ERROR_LOG_FILE_NAME = "error";

export class Logger implements ILogger {
    private readonly executionTimestamp: string;
    private readonly infoFilePath: string;
    private readonly errorFilePath: string;

    constructor() {
        this.executionTimestamp = new Date().toISOString();
        this.infoFilePath = path.join(LOGS_DIRECTORY, `${INFO_LOG_FILE_NAME}-${this.executionTimestamp}.log`);
        this.errorFilePath = path.join(LOGS_DIRECTORY, `${ERROR_LOG_FILE_NAME}-${this.executionTimestamp}.log`);

        if (!fs.existsSync(LOGS_DIRECTORY)) {
            fs.mkdirSync(LOGS_DIRECTORY, { recursive: true });
        }
    }

    info(...data: unknown[]): void {
        const msg: string = this.buildMessage(data);
        console.info(msg);
        fs.writeFileSync(this.infoFilePath, msg);
    }

    error(...data: unknown[]): void {
        const msg: string = this.buildMessage(data);
        console.error(msg);
        fs.writeFileSync(this.errorFilePath, msg);
    }

    private buildMessage(...data: unknown[]): string {
        return `[${new Date().toLocaleString()}] ${data.join(" ")}`;
    }
}