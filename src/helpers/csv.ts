import fs from "fs";
import {ArticoloDaConfigurare, articoloDaConfigurareSchema, CSV_HEADER_LINE} from "../types/articolo-da-configurare";
import { BASE_DIR } from "../const";
import path from "path";
import {CsvFileException} from "../exceptions/csv-file.exception";

export const CSV_FILE_NAME = "config.csv";
const CSV_FILE_PATH = path.join(BASE_DIR, "config.csv");

export function getArticoliDaConfigurare(): Map<string, ArticoloDaConfigurare> {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        throw CsvFileException.missingFile();
    }

    const firstLine = fs
        .readFileSync(CSV_FILE_PATH, "utf8")
        .split("\n")[0]
        .trim();

    if (firstLine !== CSV_HEADER_LINE) {
        throw CsvFileException.missingHeaderLine();
    }

    const entries = fs
        .readFileSync(CSV_FILE_PATH, "utf-8")
        .split("\n")
        .slice(1)
        .filter(line => line.trim().length > 0)
        .map(line => {
            const [ idModello, articolo, famiglia ] = line.split(",").map(s => s.trim());
            const parseArticoloDaConfigurare = articoloDaConfigurareSchema.safeParse({
                idModello, articolo, famiglia,
            });

            if (!parseArticoloDaConfigurare.success) {
                throw CsvFileException.parseFailed(line, parseArticoloDaConfigurare.error);
            }

            return [`${idModello}${articolo}${famiglia}`, parseArticoloDaConfigurare.data] as const;
        });

    return new Map(entries);
}