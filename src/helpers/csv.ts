import fs from "fs";
import type { ArticoloDaConfigurare } from "../types/articolo-da-configurare";
import { BASE_DIR, CSV_FILE_NAME } from "../const";
import path from "path";

export function getArticoliDaConfigurare(): Map<string, ArticoloDaConfigurare> {
    const entries = fs
        .readFileSync(path.join(BASE_DIR, CSV_FILE_NAME), "utf-8")
        .split("\n")
        .slice(1)
        .filter(l => l.trim().length > 0)
        .map(l => {
            const [ idModello, articolo, famiglia ] = l.split(",").map(s => s.trim());
            return [
                `${idModello}${articolo}${famiglia}`,
                {
                    idModello: Number(idModello),
                    articolo,
                    famiglia
                }] as const;
        });

    return new Map(entries);
}