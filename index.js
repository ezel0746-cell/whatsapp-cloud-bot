import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';

const genAI = new GoogleGenerativeAI('AQ.Ab8RN6IYaSh4iq8OGSBfkz08RIjgSbVKEQ5ELK84X6Zpvc4zaA');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('✅ Bot Aktif!');
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (msg.key.fromMe || !msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        try {
            const result = await model.generateContent(text);
            await sock.sendMessage(msg.key.remoteJid, { text: result.response.text() });
        } catch (e) {
            console.log("Hata oluştu.");
        }
    });

    sock.ev.on('creds.update', saveCreds);
}
startBot();
