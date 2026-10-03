const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

console.log('Iniciando o Bot do SANAFILA... Aguarde o QR Code.');

// Configura o WhatsApp com permissões para rodar no Linux
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Gera o QR Code no terminal
client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE ABAIXO PELO SEU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

// Confirma conexão
client.on('ready', () => {
    console.log('\nSucesso! Bot do SANAFILA conectado e pronto para uso!');
});

// Escuta as mensagens recebidas
client.on('message', async (msg) => {
    // 1. Travas de segurança essenciais
    if (msg.fromMe) return; // Ignora mensagens enviadas pelo próprio bot
    if (msg.isStatus) return; // Ignora atualizações de status/stories

    // Ignora mensagens de grupos (o bot do SUS só deve falar no privado)
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body.toLowerCase();

    // 2. Simulação do Fluxo D-15
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
        await msg.reply('Que ótima notícia! Vamos registrar sua alta administrativa e liberar a vaga para o próximo paciente. Obrigado por avisar!');
    } 
    else if (texto === '3') {
        await msg.reply('Registramos o seu agravamento. O nosso motor de inteligência artificial acabou de recalcular o seu risco na Matriz Dinâmica. Fique atento, você pode ser chamado em breve.');
    }
});

// INICIALIZA O CLIENTE DO WHATSAPP (A linha que faltava)
client.initialize().catch(err => console.error('Erro ao iniciar o cliente do WhatsApp:', err));

// Inicia o servidor web
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor da API rodando na porta ${PORT}`);
});