import {CSV_FILE_NAME, CSV_FILE_PATH} from "../helpers/csv";
import {CSV_HEADER_LINE} from "../types/articolo-da-configurare";
import {ZodError} from "zod";

export class CsvFileException extends Error {
    private constructor(message: string) {
        super(message);
    }

    static missingFile(): CsvFileException {
        return new CsvFileException(`File '${CSV_FILE_PATH}' non trovato.`);
    }

    static missingHeaderLine(): CsvFileException {
        return new CsvFileException(`Errore di formattazione nel file '${CSV_FILE_NAME}'. Aggiungere la riga '${CSV_HEADER_LINE}' all'inizio del file.`);
    }

    static parseFailed(line: string, error: ZodError): CsvFileException {
        return new CsvFileException(`Errore di formattazione nel file '${CSV_FILE_NAME}'. Riga in questione: '${line}'\nDettagli errore:\n${error}`);
    }
}