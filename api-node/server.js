const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Pool } = require('pg'); 
const path = require('path'); 

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sanafila_sus',
    password: '', 
    port: 5433,
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. FUNÇÃO DE RESET AUTOMÁTICO (Agora coloca o Marcos em 8º lugar garantido)
async function prepararBaseIdeathon() {
    try {
        await pool.query(`UPDATE cadsus_paciente SET nome = 'Paciente Regular' WHERE nome = 'Marcos Vinicius'`);
        
        // Elege o Marcos
        await pool.query(`
            UPDATE cadsus_paciente 
            SET nome = 'Marcos Vinicius' 
            WHERE id = (SELECT paciente_id FROM sisreg_fila WHERE status = 'AGUARDANDO' LIMIT 1)
        `);
        
        // Rebaixa todo mundo para 10 pontos (para não sujarem o Top 10)
        await pool.query(`UPDATE sisreg_fila SET score_dinamico = 10 WHERE status = 'AGUARDANDO'`);
        
        // Puxa 7 pacientes aleatórios (que não são o Marcos) para o topo (notas 80 a 95)
        await pool.query(`
            UPDATE sisreg_fila 
            SET score_dinamico = floor(random() * 15 + 80) 
            WHERE id IN (
                SELECT f.id FROM sisreg_fila f 
                JOIN cadsus_paciente p ON f.paciente_id = p.id 
                WHERE f.status = 'AGUARDANDO' AND p.nome != 'Marcos Vinicius' 
                LIMIT 7
            )
        `);
        
        // Crava o Marcos Vinicius em 50 pontos. 
        // Como há exatos 7 na frente dele, ele aparecerá na 8ª posição!
        await pool.query(`
            UPDATE sisreg_fila 
            SET score_dinamico = 50 
            WHERE paciente_id = (SELECT id FROM cadsus_paciente WHERE nome = 'Marcos Vinicius' LIMIT 1)
        `);
        
        console.log('✨ Base pronta! Marcos posicionado na 8ª posição (50 pontos) para o salto longo.');
    } catch(err) {
        console.error('Erro na preparação dos dados:', err);
    }
}
prepararBaseIdeathon();

console.log('Iniciando o Bot do SANAFILA... Aguarde.');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE (SE NECESSÁRIO) ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot do SANAFILA conectado ao WhatsApp!');
});

client.on('message', async (msg) => {
    if (msg.fromMe || msg.isStatus) return;
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body.toLowerCase();

    if (texto === 'oi' || texto === 'ola' || texto === 'olá') {
        await msg.reply(
            '*SUS - SANAFILA (Ideathon)*\n\n' +
            'Olá, Marcos! Sou o assistente virtual da Secretaria de Saúde.\n\n' +
            'Sobre o seu encaminhamento, como está a sua evolução clínica hoje?\n' +
            '1️⃣ - Melhora parcial / Já resolvi\n' +
            '2️⃣ - Estabilidade (Sintomas na mesma)\n' +
            '3️⃣ - Agravamento moderado\n' +
            '4️⃣ - Agravamento severo (Fui para a UPA / Incapacitado)'
        );
    } 
    else if (texto === '3') {
        // Agravamento moderado joga ele para 85 (meio do topo)
        await pool.query(`UPDATE sisreg_fila SET score_dinamico = 85 WHERE paciente_id = (SELECT id FROM cadsus_paciente WHERE nome = 'Marcos Vinicius' LIMIT 1)`);
        await msg.reply('Agradecemos o relato, Marcos. Registramos o aumento dos seus sintomas. Nossa equipe de regulação já foi notificada sobre a evolução do seu quadro e seu prontuário está atualizado.');
    }
    else if (texto === '4') {
        // Agravamento severo joga ele para 100 (topo absoluto)
        await pool.query(`UPDATE sisreg_fila SET score_dinamico = 100 WHERE paciente_id = (SELECT id FROM cadsus_paciente WHERE nome = 'Marcos Vinicius' LIMIT 1)`);
        await msg.reply(' Recebemos o seu alerta, Marcos. O agravamento severo foi registrado e encaminhado imediatamente à nossa regulação médica. Atenção: Como o seu caso exige cuidado imediato, não aguarde em casa. Procure a UPA 24h ou o pronto-atendimento mais próximo do seu município.');
    }
});

client.initialize().catch(console.error);

app.get('/api/fila', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.id, p.nome, f.especialidade, f.score_dinamico 
            FROM sisreg_fila f 
            JOIN cadsus_paciente p ON f.paciente_id = p.id 
            WHERE f.status = 'AGUARDANDO'
            ORDER BY f.score_dinamico DESC, f.id ASC 
            LIMIT 10;
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao buscar fila' }); }
});

app.listen(3001, () => console.log('Servidor rodando na porta 3001'));