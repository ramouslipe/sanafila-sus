-- Habilita geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela cadsus_paciente (Simula o Cadastro Nacional do SUS)
CREATE TABLE cadsus_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cns VARCHAR(15) UNIQUE NOT NULL, 
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    endereco_lat DECIMAL(10, 8), 
    endereco_lng DECIMAL(11, 8),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela rnds_historico (Simula a Rede Nacional de Dados em Saúde)
CREATE TABLE rnds_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES cadsus_paciente(id) ON DELETE CASCADE,
    cid_principal VARCHAR(10) NOT NULL, 
    diabetes BOOLEAN DEFAULT FALSE,
    hipertensao BOOLEAN DEFAULT FALSE,
    historico_faltas INT DEFAULT 0, 
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela sisreg_fila (Simula a Fila de Regulação Municipal)
CREATE TABLE sisreg_fila (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES cadsus_paciente(id) ON DELETE CASCADE,
    especialidade VARCHAR(100) NOT NULL, 
    risco_inicial_manchester VARCHAR(20) NOT NULL, 
    score_dinamico INT DEFAULT 0, 
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'AGUARDANDO' 
);