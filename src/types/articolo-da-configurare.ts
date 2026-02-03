import { z } from "zod"

export const CSV_HEADER_LINE = "ID_MODELLO,ARTICOLO,FAMIGLIA";

export const articoloDaConfigurareSchema = z.object({
    idModello: z.coerce.number(),
    articolo: z.string(),
    famiglia: z.string(),
}).strict();
export type ArticoloDaConfigurare = z.infer<typeof articoloDaConfigurareSchema>;
