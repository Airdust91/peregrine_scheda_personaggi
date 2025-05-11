require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');
const Airtable = require('airtable');
const simpleGit = require('simple-git');

// Variabili ambiente
const AIRTABLE_API_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Inizializza Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_TOKEN }).base(AIRTABLE_BASE_ID);

// Inizializza client Discord
const discordClient = new WebClient(DISCORD_TOKEN);

// Lista ufficiali e logica di rotazione
const ufficiali = [
    "Cmdr. Elira Voss",
    "Lt. Kael Dorne",
    "Dr. Syra Meneth",
    "Maggiore R. Thorne",
    "Cap. M. Severin"
];
let ufficialeCorrente = ufficiali[Math.floor(Math.random() * ufficiali.length)];
let approvazioniDaUltimoCambio = 0;
const INTERVALLO_CAMBIO = 5;

// Recupera personaggi approvati da Airtable
async function getAirtableData() {
    const records = await base('Personaggi').select({
        filterByFormula: `{Stato Approvazione} = 'Approvato'`
    }).all();

    return records.map(record => ({
        nome: record.get('Nome'),
        cognome: record.get('Cognome'),
        immagine: record.get('Immagine'),
        genere: record.get('Genere'),
        eta_anagrafica: record.get('Età Anagrafica'),
        eta_biologica: record.get('Età Biologica'),
        razza: record.get('Razza'),
        classe: record.get('Classe'),
        altezza: record.get('Altezza'),
        peso: record.get('Peso'),
        occhi: record.get('Occhi'),
        capelli: record.get('Capelli'),
        corporazione: record.get('Corporazione'),
        ruolo: record.get('Ruolo'),
        soglia_affaticamento: record.get('Soglia Affaticamento'),
        descrizione_fisica: record.get('Descrizione Fisica'),
        descrizione_carattere: record.get('Descrizione Carattere'),
        storia: record.get('Storia'),
        tratti: record.get('Tratti'),
        tratti_positivi: record.get('Tratti Positivi'),
        tratti_negativi: record.get('Tratti Negativi'),
        abilita: record.get('Abilità'),
        inventario: record.get('Inventario'),
        economia: record.get('Economia'),
        punti_esperienza: record.get('Punti Esperienza'),
        note_master: record.get('Note Master'),
        url_messaggio_discord: record.get('Messaggio Discord') || ''
    }));
}

// Clona repo e aggiorna HTML
async function updateGitHubTemplate(characterData) {
    const git = simpleGit();

    const repoDir = './scheda_template';
    if (!fs.existsSync(repoDir)) {
        await git.clone(`https://github.com/${GITHUB_REPO}.git`, repoDir);
    }

    const templateFile = `${repoDir}/scheda.html`;
    let template = fs.readFileSync(templateFile, 'utf-8');

    // Definisci i segnaposto da sostituire
    const placeholders = {
        nome: characterData.nome,
        cognome: characterData.cognome,
        genere: characterData.genere,
        eta_anagrafica: characterData.eta_anagrafica,
        eta_biologica: characterData.eta_biologica,
        razza: characterData.razza,
        classe: characterData.classe,
        altezza: characterData.altezza,
        peso: characterData.peso,
        occhi: characterData.occhi,
        capelli: characterData.capelli,
        corporazione: characterData.corporazione,
        ruolo: characterData.ruolo,
        soglia_affaticamento: characterData.soglia_affaticamento,
        descrizione_fisica: characterData.descrizione_fisica,
        descrizione_carattere: characterData.descrizione_carattere,
        storia: characterData.storia,
        tratti: characterData.tratti,
        tratti_positivi: characterData.tratti_positivi,
        tratti_negativi: characterData.tratti_negativi,
        abilita: characterData.abilita,
        inventario: characterData.inventario,
        economia: characterData.economia,
        punti_esperienza: characterData.punti_esperienza || '0',
        note_master: characterData.note_master
    };

    // Sostituisci i segnaposto nel template
    for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`\\$${key}\\$`, 'g');
        template = template.replace(regex, value || '');
    }

    // Cartella per i personaggi
    const charactersFolder = path.join(__dirname, 'personaggi');
    if (!fs.existsSync(charactersFolder)) {
        fs.mkdirSync(charactersFolder);
    }

    // Genera un nome di file sicuro
    const safeFileName = `${characterData.nome}_${characterData.cognome}`.replace(/[^\w\-]/g, '_');
    const filePath = path.join(charactersFolder, `${safeFileName}.html`);

    // Se il file esiste già, aggiornalo
    if (fs.existsSync(filePath)) {
        // Leggi il contenuto esistente
        let existingContent = fs.readFileSync(filePath, 'utf-8');

        // Aggiorna solo i campi che devono essere modificati
        for (const [key, value] of Object.entries(placeholders)) {
            const regex = new RegExp(`\\$${key}\\$`, 'g');
            existingContent = existingContent.replace(regex, value || '');
        }

        // Scrivi il contenuto aggiornato nel file
        fs.writeFileSync(filePath, existingContent);
    } else {
        // Se il file non esiste, crea una nuova scheda
        fs.writeFileSync(filePath, template);
    }

    // Committa e push su GitHub
    await git.cwd(repoDir);
    await git.add(`../personaggi/${safeFileName}.html`);
    await git.commit(`Scheda aggiornata per ${characterData.nome} ${characterData.cognome}`);
    await git.push('origin', 'main');
}


// Invia messaggio Discord
async function sendToDiscord(characterData) {
    const threadId = characterData.url_messaggio_discord;

    if (!threadId || typeof threadId !== 'string') {
        console.warn(`⚠️ Thread ID mancante o non valido per ${characterData.nome} ${characterData.cognome}`);
        return;
    }

    approvazioniDaUltimoCambio++;
    if (approvazioniDaUltimoCambio >= INTERVALLO_CAMBIO) {
        let nuovoUfficiale;
        do {
            nuovoUfficiale = ufficiali[Math.floor(Math.random() * ufficiali.length)];
        } while (nuovoUfficiale === ufficialeCorrente);
        ufficialeCorrente = nuovoUfficiale;
        approvazioniDaUltimoCambio = 0;
    }

    const safeFileName = `${characterData.nome}_${characterData.cognome}`.replace(/[^\w\-]/g, '_');

    const message = `📡 *U.E.F. Comunicazione Ufficiale del Programma Peregrine*\n\n` +
        `Candidato **${characterData.nome} ${characterData.cognome}**, la tua richiesta di adesione è stata **esaminata e approvata**.\n` +
        `Accedi al tuo dossier personale ➤ [Scheda Personale](https://github.com/${GITHUB_REPO}/blob/main/personaggi/${safeFileName}.html)\n\n` +
        `— *${ufficialeCorrente}*`;

    try {
        await discordClient.chat.postMessage({
            channel: threadId,
            text: message
        });
    } catch (error) {
        console.error(`❌ Errore durante l'invio al thread Discord (${threadId}):`, error);
    }
}

// Flusso principale
async function processCharacters() {
    try {
        const characters = await getAirtableData();
        for (const character of characters) {
            await updateGitHubTemplate(character);
            await sendToDiscord(character);
        }
    } catch (error) {
        console.error('❌ Errore nel flusso:', error);
    }
}

processCharacters();
