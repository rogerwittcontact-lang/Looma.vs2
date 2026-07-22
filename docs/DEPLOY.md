# Deploy — GitHub + Neon + Railway + Vercel

Este guia assume o fluxo que definimos: `main` → produção, `develop` →
homologação, deploy automático a cada push via GitHub Actions
(`.github/workflows/ci.yml`).

## 1. Repositório GitHub

```bash
cd looma
git init
git add .
git commit -m "Sprint 1: infra, schema, auth, repositories"
gh repo create looma --private --source=. --push
git checkout -b develop
git push -u origin develop
```

Configure em **Settings → Environments** dois ambientes: `staging` e
`production` (o workflow já referencia os dois por nome).

## 2. Banco (Neon)

1. Criar projeto no Neon → um branch de banco para `production`, outro para
   `staging` (o Neon suporta branch de banco nativamente, o que combina bem
   com a estratégia `main`/`develop`).
2. Copiar as duas connection strings de cada branch: a **pooled** (contém
   `-pooler` no host, usada em runtime) e a **direct** (usada só por
   `prisma migrate`).
3. Preencher `DATABASE_URL` e `DIRECT_DATABASE_URL` conforme o exemplo já
   documentado em `backend/.env.example`.

## 3. Backend (Railway)

1. Criar dois serviços: `looma-backend-staging` e `looma-backend-production`,
   apontando para o mesmo repositório GitHub, branches `develop` e `main`
   respectivamente.
2. Railway detecta `railway.json` na raiz automaticamente (build via
   `backend/Dockerfile`, start command já inclui `prisma migrate deploy`).
3. Variáveis de ambiente por serviço: `DATABASE_URL`, `DIRECT_DATABASE_URL`
   (branch correspondente do Neon), `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `S3_*` (se já houver bucket configurado).
4. Gerar um token por serviço (`RAILWAY_TOKEN_STAGING`,
   `RAILWAY_TOKEN_PRODUCTION`) e salvar como **GitHub Secrets** no
   ambiente correspondente.

## 4. Frontend (Vercel)

1. Importar o repositório na Vercel, apontando o *Root Directory* para
   `frontend/`.
2. Duas Vercel Envs: Preview (branch `develop`) e Production (branch `main`).
3. Definir `NEXT_PUBLIC_API_URL` apontando para a URL pública de cada
   serviço Railway correspondente.
4. Gerar `VERCEL_TOKEN` e `VERCEL_ORG_ID`, salvar como GitHub Secrets.

## 5. Fluxo de trabalho a partir daqui

```
feature/xxx → PR para develop → testes rodam → merge
                                              ↓
                                   deploy automático em staging
develop → PR para main → testes rodam → merge
                                       ↓
                             deploy automático em produção
```

Nenhum deploy manual depois desta configuração inicial — qualquer commit
em `develop` ou `main` já testa e já publica.

## O que eu não consigo fazer por aqui

Criar a conta/repositório no GitHub, o projeto no Neon, os serviços no
Railway e o projeto na Vercel exigem login e credenciais que eu não tenho
acesso neste ambiente. Se você conectar essas contas via integração,
consigo executar esses passos diretamente; caso contrário, este guia cobre
exatamente a sequência a seguir manualmente.
