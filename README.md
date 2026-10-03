<img width="1100" height="300" alt="Design sem nome (24)" src="https://github.com/user-attachments/assets/4edd0be9-64b1-4300-9bbf-039a7c18e7d7" />

**Sistema Inteligente de Regulação e Remanejamento Dinâmico de Filas do SUS com Motor Preditivo de IA e Comunicação Ativa via WhatsApp.**

<p align="center"> <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&duration=3000&pause=1000&color=0c53a0&center=true&vCenter=true&width=600&lines=Ideathon%20Mour%C3%A3o;HealthTech%20%7C%20Ci%C3%AAncia%20de%20Dados;SESAU%20Campo%20Mour%C3%A3o;Licence-MIT"/> </p>

---
## O Problema: O Desafio do Absenteísmo na Rede Municipal de Saúde

Na Gestão de Saúde Pública da Secretaria Municipal de Saúde de Campo Mourão (**SESAU**) e do Consórcio Intermunicipal de Saúde (**CISCOMCAM**), o **absenteísmo** em consultas especializadas e exames de média e alta complexidade representa um dos maiores gargalos operacionais e financeiros.

### Impacto Estatístico e Operacional:
* **Taxa Média de Faltas (30% a 45%):** Entre 3 e 4 a cada 10 pacientes agendados não comparecem ao atendimento sem aviso prévio.
* **Ociosidade da Capacidade Instalada:** Vagas em especialidades críticas (Ortopedia, Cardiologia, Neurologia, Oftalmologia) e exames de alto custo (Ressonância Magnética, Tomografia, Ultrassonografia) são permanentemente perdidas.
* **Agravamento Clínico por Espera:** Pacientes em estado de urgência velada aguardam meses na fila, enquanto pacientes que já resolveram seu problema no setor privado, mudaram de município ou melhoraram dos sintomas mantêm a vaga ocupada.
* **Prejuízo Financeiro Direto:** O custo unitário de consultas/exames não realizados é coberto pelo município ou consórcio sem o devido benefício à população, gerando um prejuízo estimado em centenas de milhares de reais anualmente em horários ociosos de profissionais e equipamentos de ponta.

---

## 2. A Solução: SANAFILA Campo Mourão

O **SANAFILA** é um ecossistema tecnológico integrado que atua como uma **camada de inteligência ativa** sobre a fila do e-SUS/SISREG. Ele combina acompanhamento humanizado via WhatsApp com um motor preditivo de Inteligência Artificial para eliminar vagas ociosas e priorizar quem realmente precisa de atendimento urgente.

### Funcionalidades Centrais:

1. **Régua Ativa de Comunicação Multiestágio (WhatsApp):**
   * **D-15 (Filtro de Desistência):** Pergunta se o paciente ainda precisa do procedimento ou se já realizou/desistiu.
   * **D-7 (Logística e Transporte):** Confirma a presença e identifica necessidades de transporte público/intermunicipal (essencial para a região do CISCOMCAM).
   * **D-1 (Confirmação Final):** Solicita confirmação imediata.

2. **Bot de Triagem e Acompanhamento Clínico Dinâmico:**
   * O paciente responde periodicamente a um questionário clínico simplificado via WhatsApp.
   * Identificação de episódios de agravamento de sintomas ou visitas recentes à UPA/Pronto Atendimento.

3. **Motor Preditivo e Reordenação Dinâmica da Fila (IA):**
   * A fila deixa de ser estática (ordem puramente cronológica) e passa a ser **dinâmica**.
   * O algoritmo recalcula continuamente a posição do paciente considerando risco clínico atualizado, vulnerabilidade social/etária e histórico de assiduidade.

4. **Remanejamento e Encaixe Instantâneo ("Fila Remanescente"):**
   * Assim que um paciente cancela ou deixa de responder no D-1, a vaga é liberada instantaneamente.
   * O sistema busca o próximo paciente com maior score de prioridade e compatibilidade logística, disparando um convite imediato de encaixe via WhatsApp.

5. **Painel de Gestão da SESAU (Dashboard):**
   * Visibilidade completa das filas por UBS (Lar Paraná, Campos Elíseos, Centro, etc.) e especialidade.
   * Monitoramento em tempo real do volume de recursos financeiros economizados e vagas recuperadas.

---

## 3. Arquitetura da Solução e Engenharia de Software

O SANAFILA foi arquitetado sob o paradigma de **Microsserviços Desacoplados baseados em Contratos de Dados (Mock-First / API-First)**. Isso permite que os módulos de Inteligência, Comunicação e Visualização funcionem de forma autônoma, resiliente e sem pontos únicos de falha.


## 1. Estrutura e Mecânica do Projeto (Como Funciona)

```text
[Agendamento de Consulta/Exame]
               │
               ▼
   [Matriz de Priorização de Fila (Motor de IA)]
   ├── Classificação de Risco (Protocolo de Manchester: Vermelho ao Azul)
   ├── Fator Demográfico e Histórico (DataSUS/RNDS)
   ├── Vulnerabilidade por Idade (Criança / Jovem / Adulto / Idoso)
   └── Escore de Evolução (Atualizado via Bot)
               | 
               ▼
   [Motor de Comunicação via WhatsApp]
   ├── D-15: Lembrete e confirmação prévia
   ├── D-7: Confirmação intermediária
   └── D-1: Confirmação final
               │
      ┌────────┴────────┐
      ▼                 ▼
[Confirmou]        [Cancelou / Não Respondeu]
   │                    │
   ▼                    ▼
[Mantém Vaga]      [Gera Vaga Ociosa]
                        │
                        ▼
           [Algoritmo de Remanejamento]
           (Notifica o próximo da fila com
            perfil e logística compatíveis)
```

## 2. Componentes do Sistema e Estrutura de Pastas:

```text
sana-campo-mourao/
├── data/                      # Dataset simulado da rede de saúde de Campo Mourão
│   ├── mock_patients.json     # 100+ Pacientes fictícios de UBSs locais
│   └── schema_contracts.json  # Contratos JSON de integração entre serviços
│
├── src/
│   ├── engine/                # Core de Inteligência (Python / FastAPI)
│   │   ├── priority_calculator.py  # Algoritmo de Score Dinâmico
│   │   ├── absenteeism_model.py   # Predictor de Risco de Falta
│   │   └── server.py               # Endpoints REST para consumo dos dados
│   │
│   ├── whatsapp/              # Módulo de Comunicação (Node.js / TypeScript)
│   │   ├── webhook.ts              # Servidor de recepção de eventos do WhatsApp
│   │   ├── conversation_flows.ts   # Réguas D-15, D-7, D-1 e Triagem Clínica
│   │   └── instant_reassignment.ts # Lógica de Encaixe de Vagas Ociosas
│   │
│   └── dashboard/             # Painel do Gestor SESAU (Streamlit / React)
│       ├── app.py                  # Interface gráfica e visualização da Fila Viva
│       ├── components/             # Gráficos de KPIs, Economia e Mapa de UBSs
│       └── simulator.py            # Simulador do fluxo de encaixe para o Pitch
│
└── docs/                      # Documentação de Negócio, LGPD e Apresentação
    ├── arquitetura.md         # Detalhamento técnico completo
    ├── modelo-negocios.md     # Estudo de viabilidade financeira e CPSI
    └── pitch-deck.pdf         # Apresentação executiva para a banca
