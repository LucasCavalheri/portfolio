# lucascavalheri

CLI da API pública de [lucascavalheri.com.br](https://lucascavalheri.com.br): perfil, projetos,
experiência, stack e contato na linha de comando. Sem dependência, sem chave, somente leitura.

```bash
npx lucascavalheri              # perfil resumido
npx lucascavalheri projetos     # projetos com stack
npx lucascavalheri experiencia  # cargos e períodos
npx lucascavalheri stack        # tecnologias por categoria
npx lucascavalheri contato      # canais de contato
npx lucascavalheri api          # índice da API
npx lucascavalheri projetos --json | jq '.[].nome'
```

`LUCASCAVALHERI_API` troca a origem, útil para apontar para um build local.

Documentação da API e especificação OpenAPI: <https://lucascavalheri.com.br/desenvolvedores>
