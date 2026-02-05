import fs from "fs";
import {Browser, BrowserContext, chromium, Dialog, Locator, Page} from "playwright";
import { type ArticoloDaConfigurare } from "../types/articolo-da-configurare";
import {Logger} from "./logger";
import {SpeedyBeemoException} from "../exceptions/speedy-beemo.exception";
import { CSV_HEADER_LINE } from "./csv";
import path from "path";

export class SpeedyBeemo {
    private static readonly SM2CARE_BASE_URL = "http://172.23.0.111/";
    private static readonly SM2CARE_LOGIN_PAGE_URL = `${SpeedyBeemo.SM2CARE_BASE_URL}login.php`;
    private static readonly SM2CARE_HOMEPAGE_URL = `${SpeedyBeemo.SM2CARE_BASE_URL}index.php`;
    private static readonly SM2CARE_LOGIN_TIMEOUT_MS = 100;
    private static readonly SM2CARE_LOGIN_ITERATIONS = 6;
    private static readonly REMAINING_ARTICOLI_DA_CONFIGURARE_DIR = "articoli_da_configurare_rimanenti";
    private static readonly REMAINING_ARTICOLI_DA_CONFIGURARE_FILE_NAME = "articoli_da_configurare_rimanenti";

    static readonly WEB_SCRAPER_PARAMS = {
        APPLY_CONFIG: (process.env.APPLY_CONFIG || "true") === "true",
        APPLY_THUMB_OK: (process.env.APPLY_THUMB_OK || "true")  === "true",
        THUMB_OK_ACTIVITIES: process.env.THUMB_OK_ACTIVITIES?.split(",") || ["ASC", "AFC"],
        SM2CARE_USERNAME: process.env.SM2CARE_USERNAME,
        SM2CARE_PASSWORD: process.env.SM2CARE_PASSWORD,
    };

    private readonly logger: Logger;
    private readonly browser: Browser;
    private readonly page: Page;
    private readonly articoliDaConfigurare: Map<string, ArticoloDaConfigurare>;

    private constructor(browser: Browser, page: Page, articoliDaConfigurare: Map<string, ArticoloDaConfigurare>) {
        this.logger = Logger.getInstance();
        this.browser = browser;
        this.page = page;
        this.articoliDaConfigurare = articoliDaConfigurare;
    }

    static async create(articoliDaConfigurare: Map<string, ArticoloDaConfigurare>): Promise<SpeedyBeemo> {
        const browser: Browser = await chromium.launch({
            headless: false,
            channel: "chrome",
        });

        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();

        return new SpeedyBeemo(browser, page, articoliDaConfigurare);
    }

    async run(): Promise<void> {
        try {
            await this.login();
            await this.navigateToBeemo();
            await this.configureArticoli();

            this.logger.info("Esecuzione terminata... Il browser verrà chiuso a momenti.");
            this.saveRemainingArticoliDaConfigurare();
        }
        finally {
            await this.browser.close();
        }
    }

    private async login(): Promise<void> {
        await this.page.goto(SpeedyBeemo.SM2CARE_LOGIN_PAGE_URL);
        await this.page.waitForLoadState("networkidle");

        if (SpeedyBeemo.WEB_SCRAPER_PARAMS.SM2CARE_USERNAME && SpeedyBeemo.WEB_SCRAPER_PARAMS.SM2CARE_PASSWORD) {
            await this.page.fill("#id_sm_utenti_username", SpeedyBeemo.WEB_SCRAPER_PARAMS.SM2CARE_USERNAME);
            await this.page.fill("#id_sm_utenti_password", SpeedyBeemo.WEB_SCRAPER_PARAMS.SM2CARE_PASSWORD);
            await this.page.click("#id_loginForm > div.login-buttons > button");
        }

        for (let i = 0; i < SpeedyBeemo.SM2CARE_LOGIN_ITERATIONS && !this.page.url().match(SpeedyBeemo.SM2CARE_HOMEPAGE_URL); i++) {
            try {
                await this.page.waitForURL(new RegExp(SpeedyBeemo.SM2CARE_HOMEPAGE_URL), { timeout: SpeedyBeemo.SM2CARE_LOGIN_TIMEOUT_MS });
            }
            catch (e) {
                if (i + 1 === SpeedyBeemo.SM2CARE_LOGIN_ITERATIONS) {
                    throw new SpeedyBeemoException("Login non effettuato entro il tempo limite.");
                }
            }
        }
    }

    private async navigateToBeemo(): Promise<void> {
        await this.page.click("#id_li_beemo > a");
        await this.page.click("#id_li_beemo_pris > a");
        await this.page.click("#id_li_beemo_pris_articoli > a");
    }

    private async configureArticoli(): Promise<void> {
        for (const [key, articoloDaConfigurare] of this.articoliDaConfigurare.entries()) {
            try {
                await this.configureArticolo(articoloDaConfigurare);
                // Se la configurazione non ha lanciato eccezioni, toglilo dalla map.
                this.articoliDaConfigurare.delete(key);
            }
            catch (e) {
                this.logger.error(
                    "Errore durante la configurazione del seguente articolo:",
                    articoloDaConfigurare,
                    "Dettagli sull'errore:",
                    e
                );
            }
        }
    }

    private async configureArticolo(articoloDaConfigurare: ArticoloDaConfigurare): Promise<void> {
        const articoloDaConfigurareString: string = Object.values(articoloDaConfigurare).join(" ");
        this.logger.info("Configurazione in corso...", articoloDaConfigurare);

        // Cerca la famiglia
        await this.page.fill("#id_table_famiglie_filter > label > input", articoloDaConfigurare.famiglia);

        // Aspetta che la tabella delle famiglie diventi visibile
        await this.waitForSuccessOrThrow(
            // Se compare una riga contenente la famiglia, allora vai avanti
            this.page.locator("#id_table_famiglie > tbody > tr:nth-child(1) > td:nth-child(1)", { hasText: new RegExp(`^${articoloDaConfigurare.famiglia}$`)}),
            // Se la tabella è vuota, esplodi
            this.page.locator("#id_table_famiglie > tbody > tr > td", { hasText: "La ricerca non ha portato alcun risultato." }),
            new SpeedyBeemoException(`Famiglia '${articoloDaConfigurare.famiglia}' non trovata.`),
        );

        // Clicca sulla prima famiglia nell'elenco
        await this.page.click("#id_table_famiglie > tbody > tr:nth-child(1)");

        // Cerca l'ID modello per assicurarti che non esista alcuna configurazione
        await this.page.fill("#id_table_pris_articoli_filter > label > input", String(articoloDaConfigurare.idModello));

        // Aspetta che la tabella dei modelli diventi visibile
        await this.waitForSuccessOrThrow(
            // Se non compare alcun modello, allora vai avanti
            this.page.locator("#id_table_pris_articoli > tbody > tr > td", { hasText: "La ricerca non ha portato alcun risultato." }),
            // Se compare una configurazione con l'ID modello corrente, esplodi
            this.page.locator("#id_table_pris_articoli > tbody > tr > td:nth-child(3)", { hasText: new RegExp(`^${articoloDaConfigurare.idModello}$`)}),
            new SpeedyBeemoException(`Esiste già una configurazione per il modello con ID '${articoloDaConfigurare.idModello}'.`)
        );

        // Clicca su "+"
        await this.page.click("#id_pris_articoli_nuovo");

        // Clicca sulla combobox
        await this.page.click("#id_pris_articoli_configForm > div.modal-body > div:nth-child(1) > div > span");
        // Cerca l'articolo
        await this.page.fill("body > span > span > span.select2-search.select2-search--dropdown > input", articoloDaConfigurare.articolo);
        // Clicca sul primo articolo visualizzato
        await this.page.click("#select2-id_pris_articoli_codice-results > li:nth-child(1)");
        // Clicca su "importa modello"
        await this.page.click("#id_pris_articoli_modprod_import");

        // Cerca l'ID del modello da configurare
        await this.page.fill("#id_table_panth_modprod_filter > label > input", String(articoloDaConfigurare.idModello));

        const modelloTrLocator: Locator = this.page.locator("#id_table_panth_modprod > tbody > tr:nth-child(1)");

        // Aspetta che venga visualizzato solo un modello, oppure che non ne venga visualizzato nessuno.
        await this.waitForSuccessOrThrow(
            // Se compare la riga con l'ID del modello che vogliamo importare, vai avanti
            modelloTrLocator.locator("td:nth-child(2)", { hasText: new RegExp(`^${articoloDaConfigurare.idModello}$`)}),
            // Se non viene trovato alcun risultato, esplodi
            this.page.locator("#id_table_panth_modprod > tbody > tr > td", { hasText: "La ricerca non ha portato alcun risultato." }),
            new SpeedyBeemoException(`Modello produttivo con ID '${articoloDaConfigurare.idModello}' non trovato. Il modello potrebbe non esistere in Panthera, oppure potrebbe essere stato impostato su uno stato diverso da 'valido'.`),
        );

        // Clicca sulla checkbox per selezionare il modello
        await modelloTrLocator.locator("td:nth-child(1) > a").click();
        // Clicca su "Importa"
        await this.page.click("#id_pris_articoli_modprod_modal_importa");

        // Visualizza 100 attività
        await this.page.selectOption("#id_table_pris_articoli_modprod_length > label > select", "100");

        if (SpeedyBeemo.WEB_SCRAPER_PARAMS.APPLY_CONFIG) {
            // Indica se il webscraper ha già settato un'attività per il conteggio dei pezzi OK.
            let thumbOkHasBeenSet: boolean = false;

            // Itera su tutte le attività
            for (let i = 0; i < await this.countRowsInTBody(this.page.locator("#id_table_pris_articoli_modprod > tbody > tr")); i++) {
                const attivitaTrLocator: Locator = this.page.locator(`#id_table_pris_articoli_modprod > tbody > tr`).nth(i);

                const [ codiceAttivita, hasRedArrow, hasGreenArrow, isOkThumbVisible, isKoThumbVisible ]:
                    [ string, boolean, boolean, boolean, boolean ] = await Promise.all([
                    attivitaTrLocator.locator("td:nth-child(4)").innerText(),
                    attivitaTrLocator.locator("i.fas.fa-angle-double-right.text-red").first().isVisible(),
                    attivitaTrLocator.locator("i.fas.fa-angle-double-right.text-green").first().isVisible(),
                    attivitaTrLocator.locator("td:nth-child(7)").isVisible(),
                    attivitaTrLocator.locator("td:nth-child(8)").isVisible(),
                ]);

                const [ isOkThumbDown, isKoThumbDown ]: [ boolean | null, boolean | null ] = await Promise.all([
                    isOkThumbVisible ? attivitaTrLocator.locator("td:nth-child(7) > a > i.fas.fa-thumbs-down.text-red").isVisible() : null,
                    isKoThumbVisible ? attivitaTrLocator.locator("td:nth-child(8) > a > i.fas.fa-thumbs-down.text-red").isVisible() : null,
                ]);

                const [ thumbOkLocator, thumbKoLocator ]: [ Locator, Locator ] = [
                    attivitaTrLocator.locator("td:nth-child(7) > a"),
                    attivitaTrLocator.locator("td:nth-child(8) > a"),
                ];

                // Configurazione pezzi OK
                if (
                    !thumbOkHasBeenSet && 
                    hasGreenArrow && 
                    isOkThumbDown && 
                    SpeedyBeemo.WEB_SCRAPER_PARAMS.APPLY_THUMB_OK && 
                    SpeedyBeemo.WEB_SCRAPER_PARAMS.THUMB_OK_ACTIVITIES.includes(codiceAttivita)
                ) {
                    await thumbOkLocator.click();
                    thumbOkHasBeenSet = true;
                }

                // Configurazione scarti
                if (hasRedArrow && isKoThumbDown) {
                    await thumbKoLocator.click();
                }

                // Se l'attività corrente ha il pollice per il conteggio OK attivo (settato in automatico da Beemo), 
                // ma il conteggio è già stato assegnato a un'altra attività precedente, 
                // tira giù il pollice.
                if (isOkThumbDown === false && thumbOkHasBeenSet) {
                    await thumbOkLocator.click();
                }
            }
        }

        // Informa l'utente che la configurazione è stata applicata. Chiedi di salvare oppure di chiudere la finestra.

        this.logger.info("Configurazione completata...");
        await this.showBlockingDialog(`Verifica la configurazione per [${articoloDaConfigurareString}]. Se ritieni che sia corretta, clicca su "Salva", altrimenti su "Chiudi". Clicca "Ok" per chiudere questo messaggio.`);

        const configuraModelloFormLocator: Locator = this.page.locator("#id_pris_articoli_configForm");
        const configurationAlreadyExistsToastLocator: Locator = this.page.locator("#toast-container > div > div.toast-message", { hasText: "SyntaxError: Unexpected end of JSON input" });
        const configurationSavedSuccessfullyLocator: Locator = this.page.locator("body > div.swal2-container > div.swal2-modal.show-swal2", { hasText: "Dati memorizzati." });

        await Promise.race([
            // Aspetto che venga visualizzato il popup di salvataggio andato a buon fine
            configurationSavedSuccessfullyLocator.waitFor({ state: "visible", timeout: 0 }),
            // Aspetto che compaia il toast di "configurazione già esistente".
            // Nonostante i controlli fatti all'inizio, potrebbe capitare che la configurazione corrente venga creata da un altro utente mentre il webscraper sta ancora girando. 
            configurationAlreadyExistsToastLocator.waitFor({ state: "visible", timeout: 0 })
                .then(() => {
                    throw new SpeedyBeemoException(`La configurazione [${articoloDaConfigurareString}] esiste già.`);
                })
                .finally(async () => {
                    // Clicca su "chiudi" per chiudere il form di configurazione del modello
                    await this.page.click("#id_pris_articoli_configForm > div.modal-footer > button.btn.btn-white");
                }),
            // Oppure aspetto che il form del modello venga chiuso
            configuraModelloFormLocator.waitFor({ state: "hidden", timeout: 0 }).then(() => { 
                throw new SpeedyBeemoException(`Configurazione non salvata per [${articoloDaConfigurareString}].` )
            }),
        ]);

        // Clicca su "OK" nel dialog che conferma il salvataggio corretto della configurazione.
        await this.page.click("body > div.swal2-container > div.swal2-modal.show-swal2 > button.swal2-confirm.styled");

        this.logger.info("Configurazione salvata", articoloDaConfigurare);
    }

    private async waitForSuccessOrThrow(successLocator: Locator, errorLocator: Locator, exception: SpeedyBeemoException): Promise<void> {
        // Attendi che compaia uno dei due elementi
        await Promise.race([
            successLocator.waitFor({ state: "visible" }),
            errorLocator.waitFor({ state: "visible" }),
        ]);

        // Se è comparso l'elemento non desiderato, esplodi
        if (await errorLocator.isVisible()) throw exception;
    }

    private async countRowsInTBody(trLocator: Locator): Promise<number> {
        await this.page.waitForLoadState("networkidle");

        let prevCount: number = -1;
        let count: number = await trLocator.count();

        while (prevCount !== count) {
            prevCount = count;
            await this.page.waitForTimeout(500);
            count = await trLocator.count();
        }
        return count;
    }

    private async showBlockingDialog(prompt: string): Promise<void> {
        const emptyFunction = () => {};

        // Obbliga l'utente ad accettare manualmente i dialog.
        this.page.addListener("dialog", emptyFunction);

        // Attendi che l'utente visualizzi l'alert.
        await this.page.evaluate(prpt => alert(prpt), prompt)

        // Ripristina il comportamento di default dei dialog.
        this.page.removeListener("dialog", emptyFunction);
    }

    private saveRemainingArticoliDaConfigurare(): void {
        fs.mkdirSync(SpeedyBeemo.REMAINING_ARTICOLI_DA_CONFIGURARE_DIR);

        const filePath: string = path.join(
            SpeedyBeemo.REMAINING_ARTICOLI_DA_CONFIGURARE_DIR,
            `${SpeedyBeemo.REMAINING_ARTICOLI_DA_CONFIGURARE_FILE_NAME}_${new Date().toISOString().replaceAll(":", "-")}`,
            ".csv"
        ); 
        
        // Add header line
        fs.writeFileSync(filePath, CSV_HEADER_LINE + "\n");

        for (const articoloDaConfigurare of this.articoliDaConfigurare.values()) {
            fs.appendFileSync(
                filePath,
                `${articoloDaConfigurare.idModello},${articoloDaConfigurare.articolo},${articoloDaConfigurare.famiglia}\n`,
            );        
        }
    }
}
