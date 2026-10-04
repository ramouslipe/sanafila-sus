import psycopg2
from datetime import datetime

DB_CONFIG = {
    'dbname': 'sanafila_sus',
    'user': 'postgres',
    'password': '', 
    'host': 'localhost',
    'port': '5433'
}

def calcular_idade(data_nascimento):
    hoje = datetime.now().date()
    return hoje.year - data_nascimento.year - ((hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day))

def recalcular_fila():
    hoje = datetime.now().date()
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                f.id, p.nome, p.data_nascimento, h.historico_faltas, 
                f.data_entrada, f.especialidade
            FROM sisreg_fila f
            JOIN cadsus_paciente p ON f.paciente_id = p.id
            JOIN rnds_historico h ON h.paciente_id = p.id
            WHERE f.status = 'AGUARDANDO';
        """)
        
        pacientes = cur.fetchall()

        for paciente in pacientes:
            fila_id, nome, data_nasc, faltas, data_entrada, especialidade = paciente
            
            # 1. Peso Etário (Máx 25 pontos)
            idade = calcular_idade(data_nasc)
            if idade >= 80:
                peso_etario = 25
            elif (60 <= idade <= 79) or (idade <= 5):
                peso_etario = 20
            elif 6 <= idade <= 17:
                peso_etario = 15
            else:
                peso_etario = 10

            # 2. Peso Histórico/Assiduidade (Máx 15 pontos)
            if faltas == 0:
                peso_historico = 15
            elif faltas == 1:
                peso_historico = 10
            else:
                peso_historico = 5

            # 3. Fator Tempo de Espera (Máx 15 pontos)
            dias_espera = (hoje - data_entrada).days
            if dias_espera > 90:
                peso_tempo = 15
            elif 30 <= dias_espera <= 90:
                peso_tempo = 10
            else:
                peso_tempo = 5

            # 4. Peso Evolução Clínica (Padrão: 15 pontos - Estabilidade)
            peso_evolucao = 15

            # SCORE TOTAL (Máximo 100)
            score_total = peso_etario + peso_historico + peso_tempo + peso_evolucao

            cur.execute("UPDATE sisreg_fila SET score_dinamico = %s WHERE id = %s;", (score_total, fila_id))

        conn.commit()
        print("✅ Fila recalculada com Sucesso usando a nova regra multicritério do SUS!")
        
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Erro no recálculo: {e}")

if __name__ == '__main__':
    recalcular_fila()