import psycopg2
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('pt_BR')

DB_CONFIG = {
    'dbname': 'sanafila_sus',
    'user': 'postgres',
    'password': '', 
    'host': 'localhost',
    'port': '5433'
}

ESPECIALIDADES = ['Ortopedia', 'Cardiologia', 'Neurologia', 'Oftalmologia']
CORES_MANCHESTER = ['Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul']
CIDS = ['I10', 'E11', 'M54', 'H25', 'G40']

def gerar_cns():
    return str(random.randint(100000000000000, 999999999999999))

def popular_dados():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Conectando ao banco... Gerando 50 pacientes fictícios.")

        for _ in range(50):
            # 1. CadSUS
            cns = gerar_cns()
            nome = fake.name()
            data_nasc = fake.date_of_birth(minimum_age=5, maximum_age=85)
            telefone = fake.phone_number()
            # Coordenadas aproximadas da região de Campo Mourão
            lat = random.uniform(-24.10, -23.95)
            lng = random.uniform(-52.45, -52.30)
            
            cur.execute("""
                INSERT INTO cadsus_paciente (cns, nome, data_nascimento, telefone, endereco_lat, endereco_lng)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
            """, (cns, nome, data_nasc, telefone, lat, lng))
            paciente_id = cur.fetchone()[0]

            # 2. RNDS
            cid = random.choice(CIDS)
            diabetes = random.choices([True, False], weights=[0.2, 0.8])[0]
            hipertensao = random.choices([True, False], weights=[0.3, 0.7])[0]
            faltas = random.randint(0, 3)

            cur.execute("""
                INSERT INTO rnds_historico (paciente_id, cid_principal, diabetes, hipertensao, historico_faltas)
                VALUES (%s, %s, %s, %s, %s);
            """, (paciente_id, cid, diabetes, hipertensao, faltas))

            # 3. SISREG
            especialidade = random.choice(ESPECIALIDADES)
            risco = random.choices(CORES_MANCHESTER, weights=[0.05, 0.1, 0.2, 0.45, 0.2])[0]
            dias_atras = random.randint(0, 180)
            data_entrada = datetime.now() - timedelta(days=dias_atras)

            cur.execute("""
                INSERT INTO sisreg_fila (paciente_id, especialidade, risco_inicial_manchester, data_entrada)
                VALUES (%s, %s, %s, %s);
            """, (paciente_id, especialidade, risco, data_entrada.date()))

        conn.commit()
        cur.close()
        conn.close()
        print("Sucesso! Banco populado.")

    except Exception as e:
        print(f"Erro ao popular banco: {e}")

if __name__ == '__main__':
    popular_dados()