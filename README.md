# Portfólio — Lucas Cavalheri

Site pessoal em <https://lucascavalheri.com.br>. Astro estático, sem framework de
interface, publicado na Vercel.

Além das páginas em HTML, o mesmo conteúdo é servido em formatos que agentes e
scripts conseguem ler: markdown, JSON, `llms.txt`, OpenAPI, um servidor MCP e
uma CLI no npm.

## Rodando

```bash
npm install
npm run dev
```

| Comando | O que faz |
| :-- | :-- |
| `npm run dev` | Servidor local em `localhost:4321` |
| `npm run build` | Gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` para conferir antes do deploy |
| `npm test` | Testes (Vitest) |
| `npm run verify` | `build` + testes — é o que vale antes de commitar |
| `npm run verificar:producao` | Checa a produção no ar: cabeçalhos, contratos e limites |
| `npm run indexnow` | Notifica os buscadores sobre as URLs atualizadas |

`npm run verify` roda o build antes dos testes de propósito: boa parte da suíte
lê os arquivos gerados em `dist/`, então testar sem buildar valida a versão
anterior.

## De onde vem o conteúdo

Nada de texto duplicado entre a página e as versões para máquina. Tudo sai de
`src/data/`, e cada superfície apenas formata:

| Arquivo | Conteúdo |
| :-- | :-- |
| `site.ts` | Identidade: nome, cargo, contato, redes, "bom para" / "não atende" |
| `conteudo.ts` | Projetos, experiências e a stack em destaque na home |
| `tec.ts` | Catálogo de tecnologias — nome, link, descrição e cor de marca |
| `contato.ts` | Canais de contato |
| `markdown.ts` | Monta as versões `.md` de cada página |
| `api.ts` | Monta o JSON da API pública |
| `openapi.ts` | Especificação OpenAPI da API |
| `agentes.ts` / `agente-http.ts` | Descoberta por agentes, MCP e `.well-known` |

Para adicionar um projeto, mexa só em `conteudo.ts`: a home, o `/index.md`, o
`/api/v1/projetos.json` e o `llms.txt` acompanham sozinhos. Se ele usar uma
tecnologia que ainda não existe em `tec.ts`, cadastre lá primeiro — o ícone
entra no sprite automaticamente a partir do que a página referencia.

Cores de marca passam por `cor.ts` antes de aparecer. Marcas pretas como Next.js
e Rust sumiriam no tema escuro, e o amarelo do JavaScript quase não aparece no
claro, então a luminosidade é ajustada por tema em HSL.

## Superfícies para máquina

| Rota | Formato |
| :-- | :-- |
| `/index.md`, `/sobre.md`, … | Markdown de cada página |
| `/llms.txt` | Resumo do site para modelos de linguagem |
| `/api/v1/*.json` | API pública, sem chave e somente leitura |
| `/openapi.json` | Especificação da API |
| `/mcp` | Servidor MCP |
| `/.well-known/*` | Descoberta: catálogo de API, catálogo de IA, OAuth, JWKS |
| `/desenvolvedores` | Documentação de tudo isso, em HTML |

`npx lucascavalheri` consulta os mesmos dados pelo terminal. A CLI mora em
`cli/` e é publicada separadamente no npm.

O `vercel.json` cuida dos cabeçalhos que essas rotas exigem — `Content-Type`
correto para markdown e `llms.txt`, CORS nas rotas públicas, `Link` de descoberta
na home — além dos redirects de caminhos que as pessoas tentam adivinhar
(`/projects`, `/cv`, `/uses`). Pré-visualizações em `*.vercel.app` recebem
`noindex` para não competir com o domínio.

## Testes

`testes/api.test.ts` e `testes/agentes.test.ts` leem o `dist/` e conferem que os
contratos publicados continuam de pé: os JSON respondem o que a OpenAPI promete,
as rotas de descoberta existem, os redirects apontam para lugares reais e as
versões em markdown têm o mesmo conteúdo da página. São eles que impedem uma
mudança em `src/data/` de quebrar silenciosamente um consumidor.
