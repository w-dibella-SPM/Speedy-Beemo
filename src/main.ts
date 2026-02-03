import { getArticoliDaConfigurare } from "./helpers/csv";
import { ArticoloDaConfigurare } from "./types/articolo-da-configurare";
import { Logger } from "./helpers/logger";
import "./helpers/zod-locales-config";
import dotenv from "dotenv";
import path from "path";
import {BASE_DIR} from "./const";
import { SpeedyBeemo } from "./helpers/speedy-beemo";

const logger = Logger.getInstance();
dotenv.config({
    path: path.join(BASE_DIR, ".env"),
});

async function main() {
    logger.info( "PARAMETRI:", SpeedyBeemo.WEB_SCRAPER_PARAMS)

    const articoliDaConfigurare: Map<string, ArticoloDaConfigurare> = getArticoliDaConfigurare();
    const speedyBeemo: SpeedyBeemo = await SpeedyBeemo.create(articoliDaConfigurare);
    await speedyBeemo.run();
}

main().catch(error => {
    logger.error(error);
});
