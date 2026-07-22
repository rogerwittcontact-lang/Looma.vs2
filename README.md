# Looma — Sprint 1

Infraestrutura, banco de dados, autenticação e repositories. Nenhuma tela de
produto ainda — Dashboard, Timeline, Proofing e Workflow entram nas Sprints
seguintes, seguindo os wireframes já validados em `/docs`.

## Estrutura

```
/docs
    architecture-decisions/     ADRs (placeholders até serem citadas por código)
/backend
    prisma/schema.prisma        Domain Schema v1.1 completo
    prisma/seed.ts              Catálogo de Tipos de Entrega + cenário de exemplo
    src/domain/repositories/    Interfaces (contratos), independentes de Prisma
    src/infrastructure/         Implementações Prisma dos repositories
    src/auth/                   Registro, login, JWT + refresh token
/frontend                       Scaffold Next.js (sem telas ainda)
docker-compose.yml
```

## Subindo o ambiente local

```bash
cp backend/.env.example backend/.env
docker compose up
```

Isso sobe Postgres, Redis, MinIO, backend (NestJS) e frontend (Next.js).
O backend roda `prisma migrate deploy` automaticamente antes de iniciar.

## Primeira migration (ambiente de desenvolvimento)

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
```

## Rodando os testes

```bash
cd backend
npm test
```

## Autenticação — endpoints disponíveis nesta Sprint

- `POST /auth/register` — `{ displayName, email, password }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/refresh` — `{ refreshToken }`

## O que não está nesta Sprint

Use Cases (`CreateProjectUseCase`, `RegisterDecisionUseCase`,
`ComputePendingUseCase` etc.), endpoints de domínio (`/projects`,
`/approvals`, `/dashboard`) e qualquer tela de UI. Isso é Sprint 2 e 3,
conforme o plano acordado.
