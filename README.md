# <img width="40" height="40" alt="MineFlow" src="https://github.com/user-attachments/assets/86409c7e-cca3-471f-89a8-d53ff6dd8024" /> MineFlow 2.0

**MineFlow** é uma aplicação web para transformar planilhas Excel (.xlsx / .xls) em fluxos de decisão interativos, com lógica condicional, envio de e-mails, inputs/checklists e visualização de fluxograma via Mermaid.js.

---

## 🚀 Funcionalidades Principais

- Upload de planilhas Excel com múltiplas abas  
- Navegação entre abas da planilha  
- Interpretação de passos com lógica direta (`direto`), decisão (`decisao`) ou final (`final`)  
- Criação de fluxos condicionais (Sim / Não)  
- Exibição de títulos, descrições, imagens, documentos anexos  
- Inputs de usuário e checklists por passo  
- Envio de e-mail configurado (to, cc, assunto)  
- Visualização do fluxo completo como diagrama (Mermaid)  
- Exportação do fluxo e das descrições em PDF (com imagens inclusas)  
- Salvar sessão no `localStorage` e restaurar ao recarregar a página  
- Barra de progresso e breadcrumbs de navegação  
- Interface responsiva para dispositivos móveis  

---

## 📂 Estrutura de Arquivos e Dependências

Sugestão de estrutura de projeto:
```
├── 📁 .git/ 🚫 (auto-hidden)
├── 📁 css/
│   ├── 📁 img/
│   │   ├── 🖼️ MineFlow.svg
│   │   └── 🖼️ background.svg
│   └── 🎨 style.css
├── 📁 js/
│   └── 📄 script.js
├── 📖 README.md
└── 🌐 index.html
```
---

## 🖼️ Exemplo de Fluxo no Excel

O arquivo Excel deve conter uma aba com as seguintes colunas obrigatórias:

| Coluna              | Descrição                                              |
|---------------------|--------------------------------------------------------|
| `ID`                | Identificador único do passo                          |
| `Título do Passo`   | Título que será exibido ao utilizador                 |
| `Descrição`         | Explicação ou instrução do passo                      |
| `Tipo`              | Tipo de passo (informativo, decisivo, etc.)          |
| `Próximo Direto`    | ID do próximo passo direto (caso aplicável)          |
| `Próximo Sim`       | ID do passo se a resposta for "Sim"                  |
| `Próximo Não`       | ID do passo se a resposta for "Não"                  |
| `Email Para`        | Endereço de e-mail para envio automático             |
| `Email CC`          | CC do e-mail                                          |
| `Assunto Email`     | Assunto padrão do e-mail gerado                       |
| `Imagem`            | URL da imagem a ser exibida                           |
| `Documento_Anexo`   | URL de um documento (PDF, etc.)                       |
| `Checklist`         | Tarefas separadas por ponto e vírgula `;`            |
| `Input_Requerido`   | Nome do campo obrigatório para preenchimento manual   |
| `Prioridade`        | Nível de prioridade (ex: Alto, Médio, Baixo)         |
| `Cor_Prioridade`    | Cor de destaque (vermelho, laranja, azul, verde)     |

---

## 🧠 Como Funciona

1. **Carregue o arquivo Excel** com o botão "Escolher Ficheiro".
2. Selecione a aba desejada (caso o arquivo contenha várias).
3. Navegue pelos passos interativos do fluxo:
   - Responda a perguntas Sim/Não
   - Marque tarefas em checklists
   - Preencha campos obrigatórios
   - Envie e-mails com base nos dados do passo
4. Ao final, visualize o **fluxo completo** com o botão _"Visualizar Fluxo Completo"_.
5. Exporte o fluxo como **PDF**.

---
## 🧩 Dependências Externas

As seguintes bibliotecas são carregadas via CDN:

- [XLSX.js](https://cdnjs.com/libraries/xlsx) – Leitura de arquivos Excel
- [Mermaid.js](https://mermaid.js.org/) – Geração de fluxogramas
- [jsPDF](https://github.com/parallax/jsPDF) – Geração de arquivos PDF
- [html2canvas](https://html2canvas.hertzen.com/) – Captura de DOM para imagem
- [Font Awesome](https://fontawesome.com/) – Ícones

---

## 💾 Armazenamento de Sessão

O fluxo e os dados preenchidos são automaticamente salvos no `localStorage` do navegador. Ao recarregar a página, o sistema perguntará se você deseja continuar de onde parou.

---

## 🧪 Requisitos Técnicos

- Navegador moderno com suporte a `ES6`, `localStorage`, `Blob`, e `Canvas`
- Conexão com a internet (para carregar CDNs)

---

## 🛠️ Desenvolvimento

Você pode personalizar:

- O estilo visual em `css/style.css`
- As regras de validação ou comportamento em `js/script.js`

---

## 📦 Build e Deploy

O projeto pode ser hospedado diretamente em um servidor estático como:

- GitHub Pages
- Netlify
- Vercel

> Basta fazer upload dos arquivos do projeto — não há backend necessário.

---

## 📝 Licença

Este projeto é de uso interno ou experimental. Se desejar redistribuir, consulte as licenças das bibliotecas utilizadas.

---

## 🙋‍♂️ Contribuições

Contribuições são bem-vindas! Abra uma _issue_ ou envie um _pull request_ com melhorias, sugestões ou correções.

---

