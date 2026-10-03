import psycopg2
import pandas as pd
import warnings
from sklearn.tree import DecisionTreeClassifier
from datetime import datetime

# Ignora os avisos chatos do Pandas sobre conexões diretas no Postgres
warnings.filterwarnings('ignore')

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

def rodar_predicao():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        
        # 1. Extraindo dados do PostgreSQL
        query = """
            SELECT 
                p.id, p.nome, p.data_nascimento, 
                h.diabetes, h.hipertensao, h.historico_faltas,
                f.especialidade
            FROM cadsus_paciente p
            JOIN rnds_historico h ON p.id = h.paciente_id
            JOIN sisreg_fila f ON p.id = f.paciente_id
            WHERE f.status = 'AGUARDANDO';
        """
        df = pd.read_sql_query(query, conn)
        
        # 2. Engenharia de Recursos (Preparando os dados para a IA)
        df['idade'] = df['data_nascimento'].apply(calcular_idade)
        df['diabetes'] = df['diabetes'].astype(int)
        df['hipertensao'] = df['hipertensao'].astype(int)
        
        # Simulação MVP: Criando uma variável alvo fictícia baseada em regras de negócio
        # (Na vida real, isso viria de consultas passadas canceladas)
        df['target_falta'] = ((df['historico_faltas'] > 0) | (df['idade'] < 30)).astype(int)
        
        # Features (Variáveis que a IA vai analisar)
        X = df[['idade', 'diabetes', 'hipertensao', 'historico_faltas']]
        y = df['target_falta']
        
        # 3. Treinando a Árvore de Decisão
        clf = DecisionTreeClassifier(max_depth=3, random_state=42)
        clf.fit(X, y)
        
        # 4. Fazendo a predição da probabilidade de falta (%)
        df['probabilidade_falta'] = clf.predict_proba(X)[:, 1] * 100
        
        print("\n--- 🧠 IA SANAFILA: PREDIÇÃO DE ABSENTEÍSMO ---")
        top_risco = df.sort_values(by='probabilidade_falta', ascending=False).head(10)
        
        for index, row in top_risco.iterrows():
            nome = row['nome'][:20].ljust(20)
            espec = row['especialidade'].ljust(15)
            prob = f"{row['probabilidade_falta']:.1f}%"
            print(f"Paciente: {nome} | {espec} | Risco de Falta: {prob}")

        conn.close()
        
    except Exception as e:
        print(f"Erro na predição: {e}")

if __name__ == '__main__':
    rodar_predicao()