# 🩺 MedConcursos - Vagas para Médico com Distância de Divinópolis - MG

Aplicação web desenvolvida para raspar, estruturar e exibir as vagas de concurso público para **Médico** do site **[PCI Concursos](https://www.pciconcursos.com.br/vagas/medico)**, calculando automaticamente a **distância geográfica em relação a Divinópolis - MG**.

Compatível com execução **Local** e hospedagem 100% gratuita no **GitHub Pages** (com atualização automática diária via GitHub Actions).

---

## 🌐 Publicando no GitHub Pages (Passo a Passo)

Como o GitHub Pages só hospeda arquivos estáticos, preparamos o projeto com uma **Automação no GitHub Actions** que roda o scraper em Python todo dia na nuvem gratuitamente, atualiza os dados e publica no site sem você precisar de nenhum servidor pago!

### 1. Crie um repositório no GitHub
1. Acesse [github.com/new](https://github.com/new).
2. Dê um nome ao repositório (ex.: `medconcursos` ou `concurso-medico`).
3. Deixe como **Public** e **não** marque as opções de README nem .gitignore (o projeto já tem).
4. Clique em **Create repository**.

### 2. Envie os arquivos do seu computador
No terminal da pasta do projeto, execute os comandos:
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```
*(Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelo seu usuário e nome do repo no GitHub)*.

### 3. Ative o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment**:
   - **Source**: Selecione `Deploy from a branch`.
   - **Branch**: Selecione `main` e a pasta `/ (root)`.
4. Clique em **Save**.

Pronto! Em cerca de 1 minuto, seu site estará no ar no link:
`https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

### 4. Permissão para o GitHub Actions atualizar sozinho
Para a automação diária poder salvar as vagas atualizadas:
1. No repositório, vá em **Settings** > **Actions** > **General**.
2. Role até **Workflow permissions** e marque:
   - **Read and write permissions**.
3. Clique em **Save**.

---

## ⚡ Atualização Automática vs Manual

- **Atualização Automática**: O arquivo `.github/workflows/update_vagas.yml` roda todos os dias às **06:00 (horário de Brasília)**, raspa o PCI Concursos e atualiza o site automaticamente.
- **Atualização Manual com 1 clique**:
  1. Vá na aba **Actions** do seu repositório no GitHub.
  2. Clique em **Atualização Automática de Vagas**.
  3. Clique no botão **Run workflow** > **Run workflow**.

---

## 💻 Executando Localmente no Computador

Você também pode continuar usando normalmente no seu computador:
- Dê dois cliques em `iniciar.bat`, ou:
```bash
pip install -r requirements.txt
python main.py
```
Acesse em: `http://localhost:8000`
