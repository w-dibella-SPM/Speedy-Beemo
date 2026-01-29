# ⚡ Speedy Beemo

---

##  🚀 Introduzione
Speedy Beemo è un web scraper progettato per creare più rapidamente configurazioni in Beemo, automatizzando azioni ripetitive.

## 📋 Requisiti 
Il tool si aspetta un file chiamato `config.csv` nella cartella principale, strutturato come segue:
```
ID_MODPROD,ARTICOLO,FAMIGLIA
12345,F010-000403,BMW 5 Alette
12346,F010-001234,G70-TOTALE
```

> **NOTA**: la prima riga viene considerata come intestazione, pertanto è **importante inserirla** nel file.

## 📖 Funzionamento 
L'esecuzione del tool segue un processo semi-automatico per la creazione delle configurazioni:
> **Operazioni preliminari**: lettura del file csv di configurazione.

> **Login**: all'avvio, il software richiederà le credenziali per accedere al portale.

> **Validazione manuale**: per ogni singola configurazione proposta nel CSV, il web scraper chiederà all'utente di:
> - Verificare la correttezza dei pollici inseriti.
> - Apportare eventuali modifiche.
> - Salvare la configurazione, oppure annullarla chiudendo il popup di creazione.


## ⚙️ Logica di default
Se non diversamente specificato, Speedy Beemo propone questa configurazione:
- **Pollice su 👍 su "Conta KO"**: inserito in **tutte le attività** dove è presente uno **scarto**.
- **Pollice su 👍 su "Conta OK"**: inserito solo nella prima attività dove è presente un prodotto (contrassegnata dalle freccine verdi "🟢 **>>**").


## 🛠 Override logica di default
È possibile modificare la logica di default modificando il file `.env`:
```
| Chiave               | Valori           | Descrizione                                                                                                                                                        |
|----------------------|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| APPLY_DEFAULT_CONFIG | `true` / `false` | Se impostato su `false`, lo scraper **non esegue alcuna pre-compilazione automatica** e lascia tutti i campi vuoti per l’inserimento manuale da parte dell’utente. |
| APPLY_THUMB_OK       | `true` / `false` | Se impostato su `false`, lo scraper **non applica il pollice 👍 al “Conta OK”** sulla prima attività e si limita a gestire esclusivamente i KO.                    |
```
_Esempio di file `.env`_:

```
APPLY_DEFAULT_CONFIG=true
APPLY_THUMB_OK=false
```

## 🔍 Log e diagnostica
I file di log vengono generati automaticamente a ogni esecuzione del programma.
Nella cartella `logs/` vengono salvati i seguenti file:
- **Errori**: `errors_<timestamp>.log`
- **Dettagli esecuzione**: `run_<timestamp>.log`

## ℹ️ Informazioni aggiuntive o supporto
Per ulteriori informazioni o per ricevere supporto, è possibile contattare:
- [William Di Bella](mailto:w.dibella@spmspa.it) (creatore del tool)
- [Team Digitalizzazione](mailto:digitalizzazione@spmspa.it)