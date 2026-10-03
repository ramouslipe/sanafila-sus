const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Pool } = require('pg'); // <-- Importação do banco de dados

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sanafila_sus',
    password: '', 
    port: 5433,
});

const app = express();
app.use(express.json());

console.log('Iniciando o Bot do SANAFILA... Aguarde.');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE (SE NECESSÁRIO) ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot do SANAFILA conectado ao WhatsApp e ao Banco de Dados!');
});

client.on('message', async (msg) => {
    if (msg.fromMe) return;
    if (msg.isStatus) return;

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body.toLowerCase();

    // Fluxo D-15
    if (texto === 'oi' || texto === 'ola' || texto === 'olá') {
        await msg.reply(
            '*SUS - SANAFILA (Ideathon CISCOMCAM)*\n\n' +
            'Olá! Sou o assistente de triagem da fila de especialidades.\n\n' +
            'Sobre o motivo do seu encaminhamento, como você se encontra hoje?\n' +
            '1️⃣ - Estou na mesma\n' +
            '2️⃣ - Melhorei / Já resolvi no particular\n' +
            '3️⃣ - Piorei bastante'
        );
    } 
    else if (texto === '1') {
        await msg.reply('Entendido. Sua posição na fila está mantida com base no tempo de espera.');
    } 
    else if (texto === '2') {
        try {
            // MVP: Altera o primeiro paciente da fila que estiver AGUARDANDO
            await pool.query(`
                UPDATE sisreg_fila 
                SET status = 'CANCELADO - ALTA VIA WHATSAPP' 
                WHERE id = (SELECT id FROM sisreg_fila WHERE status = 'AGUARDANDO' LIMIT 1)
            `);
            await msg.reply('Que ótima notícia! Registramos sua alta e a vaga já foi liberada no sistema para outro paciente. Obrigado!');
            console.log('🔄 SUCESSO: Vaga ociosa recuperada no banco de dados!');
        } catch (err) {
            console.error('Erro no banco:', err);
        }
    } 
    else if (texto === '3') {
        try {
            // MVP: Adiciona 50 pontos de risco ao paciente
            await pool.query(`
                UPDATE sisreg_fila 
                SET score_dinamico = score_dinamico + 50 
                WHERE id = (SELECT id FROM sisreg_fila WHERE status = 'AGUARDANDO' LIMIT 1)
            `);
            await msg.reply('Registramos o seu agravamento. Nosso motor já recalculou seu risco e aumentou sua prioridade na fila.');
            console.log('🚨 SUCESSO: Agravamento clínico registrado e score atualizado!');
        } catch (err) {
            console.error('Erro no banco:', err);
        }
    }
});

client.initialize().catch(err => console.error('Erro no WhatsApp:', err));

app.listen(3000, () => {
    console.log('Servidor da API rodando na porta 3000');
});