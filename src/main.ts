import { getArticoliDaConfigurare } from "./helpers/csv";
import { ArticoloDaConfigurare } from "./types/articolo-da-configurare";
import { Logger } from "./helpers/logger";


(function main() {
    const logger = new Logger();

    const articoliDaConfigurare: Map<string, ArticoloDaConfigurare> = getArticoliDaConfigurare();
    logger.info(articoliDaConfigurare);
})();