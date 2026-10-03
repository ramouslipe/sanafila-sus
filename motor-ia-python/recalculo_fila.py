import psycopg2
from datetime import datetime

DB_CONFIG = {
    'dbname': 'sanafila_sus',
    'user': 'postgres',
    'password': '', 
    'host': 'localhost',
    'port': '5433'
}

PESOS_RISCO = {'Vermelho': 100, 'Laranja': 80, 'Amarelo': 60, 'Verde': 30, 'Azul': 10}

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
                f.id, p.nome, p.data_nascimento, h.diabetes, h.hipertensao, 
                f.risco_inicial_manchester, f.data_entrada, f.especialidade
            FROM sisreg_fila f
            JOIN cadsus_paciente p ON f.paciente_id = p.id
            JOIN rnds_historico h ON h.paciente_id = p.id
            WHERE f.status = 'AGUARDANDO';
        """)
        
        pacientes = cur.fetchall()

        for paciente in pacientes:
            fila_id, nome, data_nasc, diabetes, hipertensao, risco, data_entrada, especialidade = paciente
            score = PESOS_RISCO.get(risco, 0)
            
            idade = calcular_idade(data_nasc)
            if idade >= 60 or idade <= 12:
                score += 20
                
            if diabetes and hipertensao:
                score += 15
                
            score += (hoje - data_entrada).days

            cur.execute("UPDATE sisreg_fila SET score_dinamico = %s WHERE id = %s;", (score, fila_id))

        conn.commit()

        # Exibe o Top 10 atualizado
        cur.execute("""
            SELECT p.nome, f.especialidade, f.risco_inicial_manchester, f.score_dinamico
            FROM sisreg_fila f JOIN cadsus_paciente p ON f.paciente_id = p.id
            ORDER BY f.score_dinamico DESC LIMIT 10;
        """)
        
        print("\n--- TOP 10 PRIORIDADES ATUALIZADAS ---")
        for p in cur.fetchall():
            print(f"{p[0][:25].ljust(25)} | {p[1].ljust(15)} | {p[2].ljust(10)} | Score: {p[3]}")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"Erro no recálculo: {e}")

if __name__ == '__main__':
    recalcular_fila()