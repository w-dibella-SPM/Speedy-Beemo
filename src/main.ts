import "./helpers/env";
import { getArticoliDaConfigurare } from "./helpers/csv";
import { ArticoloDaConfigurare } from "./types/articolo-da-configurare";
import { Logger } from "./helpers/logger";
import "./helpers/zod-locales-config";
import { SpeedyBeemo } from "./helpers/speedy-beemo";
import { VERSION } from "./const";

const logger = Logger.getInstance();


async function main() {
    logger.info(`Versione: ${VERSION}`);
    logger.info( "PARAMETRI:", SpeedyBeemo.WEB_SCRAPER_PARAMS)

    const articoliDaConfigurare: Map<string, ArticoloDaConfigurare> = getArticoliDaConfigurare();
    const speedyBeemo: SpeedyBeemo = await SpeedyBeemo.create(articoliDaConfigurare);
    await speedyBeemo.run();
}

main().catch(error => {
    logger.error(error);
});
