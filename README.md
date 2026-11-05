# 🩺 MedConcursos - Vagas para Médico com Distância de Divinópolis - MG

Aplicação web desenvolvida para raspar, estruturar e exibir as vagas de concurso público para **Médico** do site **[PCI Concursos](https://www.pciconcursos.com.br/vagas/medico)**, calculando automaticamente a **distância geográfica em relação a Divinópolis - MG**.

---

## 🚀 Funcionalidades

1. **Extração Automática de Vagas (Web Scraping)**
   - Extrai em tempo real do [PCI Concursos - Vagas para Médico](https://www.pciconcursos.com.br/vagas/medico).
   - Dados detalhados por concurso:
     - **Órgão / Instituição**: Prefeitura, Fundação, Hospital, Universidade, etc.
     - **Cidade e Estado (UF)**.
     - **Valores / Remuneração**: Salário máximo divulgado e especificações de vencimentos.
     - **Data de Encerramento**: Prazo final de inscrições com contagem de dias restantes (*"Últimos dias"*, *"Inscrições Abertas"*, *"Encerrado"*).
     - **Número de Vagas**: Quantidade exata de vagas ou indicação de Cadastro de Reserva (CR).
     - **Link Direto**: Atalho para o edital e detalhes na página oficial do concurso.

2. **Cálculo de Distância até Divinópolis - MG**
   - Ponto de referência: **Divinópolis - MG** (`Latitude: -20.1446`, `Longitude: -44.8912`).
   - Base de dados georreferenciada de todos os **5.571 municípios brasileiros do IBGE**.
   - **Distância direta**: Fórmula de Haversine em quilômetros.
   - **Distância rodoviária estimada**: Estimativa de trajeto rodoviário real.
   - **Botão Google Maps**: Abre a rota de carro detalhada partindo de Divinópolis diretamente para a cidade do concurso.
   - **Classificação visual por proximidade**:
     - ⚡ **Vizinho (< 70 km)**: Ex: *Onça de Pitangui (47 km)*, *Piracema (59 km)*.
     - 🚗 **Próximo (70 - 150 km)**: Ex: *Belo Horizonte (104 km)*, *Confins (110 km)*, *Lagoa Santa (118 km)*, *São João del-Rei (128 km)*.
     - 🧭 **Médio (150 - 300 km)**: Interior de Minas Gerais e divisa.
     - 📍 **Distante / Muito Distante (> 300 km)**.

3. **Filtros Avançados**
   - **Por Estado (UF)**: Selecione MG, SP, RJ, SC, RS, DF, etc. (com contagem de vagas em cada estado).
   - **Por Distância de Divinópolis**: Todas, Até 100 km, Até 200 km, Até 300 km, Até 500 km.
   - **Por Faixa Salarial**: Qualquer valor, A partir de R$ 5.000, R$ 10.000, R$ 15.000, R$ 20.000 ou apenas com salário divulgado.
   - **Por Status**: Apenas inscrições abertas (padrão), todos os concursos ou apenas encerrados.
   - **Busca Textual em Tempo Real**: Filtre por nome da prefeitura, cidade, especialidade médica ou palavras-chave.

4. **Organização e Ordenação (Sorting)**
   - 🚗 **Menor Distância de Divinópolis** (mais próximos primeiro).
   - 💰 **Maior Salário** (maiores vencimentos no topo).
   - 💰 **Menor Salário**.
   - ⏳ **Data de Encerramento mais próxima** (inscrições terminando antes).
   - 📅 **Data de Encerramento com mais prazo**.
   - 🏢 **Ordem Alfabética (A-Z)**.

5. **Interface Moderna e Responsiva**
   - Alternância entre **Modo Cards** e **Modo Tabela** (estilo planilha).
   - Cards com indicadores estatísticos no topo (Total de vagas, vagas em MG, vaga mais próxima, maior salário).
   - Botão **"Atualizar Vagas"** para recarregar o PCI Concursos sob demanda.
   - Botão **"Exportar CSV"** para download e abertura no Excel.

---

## 💻 Como Executar

### Opção 1: Pelo executável rápido (Windows)
Basta dar dois cliques no arquivo:
```cmd
iniciar.bat
```
Ele iniciará o servidor e abrirá o navegador em `http://localhost:8000`.

### Opção 2: Pelo terminal
1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Execute o servidor:
```bash
python main.py
```

3. Acesse no navegador:
```
http://localhost:8000
```

---

## 📁 Estrutura do Projeto

```
concurso/
├── data/
│   ├── municipios.json   # 5.571 municípios brasileiros com coordenadas IBGE
│   └── vagas.json        # Cache local das vagas coletadas
├── static/
│   ├── index.html        # Interface visual (Tailwind CSS + Lucide Icons)
│   └── app.js            # Lógica interativa, filtros, ordenação e exportação
├── main.py               # Servidor FastAPI com rotas da API
├── scraper.py            # Coletor do PCI Concursos com parser geográfico
├── requirements.txt      # Dependências Python
├── iniciar.bat           # Script 1-clique para Windows
└── README.md             # Documentação do projeto
```

