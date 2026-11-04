# EntreNós

EntreNós é uma rede de pequenas ajudas entre vizinhos de uma comunidade residencial. A ideia é facilitar que moradores peçam e ofereçam ajudas do dia a dia, por meio de um webapp e de um bot de WhatsApp, nas categorias da v1: receber encomendas, regar plantas, pequenas compras, auxílio com tecnologia, companhia e auxílio visual (pedido imediato, chamado "Olhar Amigo"). Projeto acadêmico em desenvolvimento.

Fora do escopo: serviços pagos, pagamentos ou empréstimo de dinheiro, orientação médica, transporte de pessoas, cuidado de crianças, emergências e atividades de risco.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- ESLint
- Deploy na Vercel
- Supabase (banco de dados, etapa futura)

## Requisitos

- Node.js 26.x (definido em `engines` no `package.json`)
- npm

## Como rodar localmente

```bash
npm install
npm run dev
```

Depois abra [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de ambiente

Variáveis de ambiente (chaves, tokens, URLs privadas) ficam em um arquivo `.env.local` na raiz do projeto. Esse arquivo **nunca é versionado**: o `.gitignore` bloqueia todos os arquivos `.env*`. Este repositório é público, portanto nenhum segredo deve ser commitado. Em produção, as variáveis são configuradas diretamente no painel da Vercel.
