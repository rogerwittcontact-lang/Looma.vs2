-- Looma — Migration inicial (Domain Schema v1.1)
-- Gerada manualmente a partir de prisma/schema.prisma, pois o ambiente de
-- geração não tinha acesso à CDN de binários do Prisma no momento da criação.
-- Validada executando este arquivo diretamente contra um PostgreSQL 16 real.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────── Enums ─────────────────────────

CREATE TYPE "AccountType" AS ENUM ('PESSOA', 'ORGANIZACAO');
CREATE TYPE "InternalRole" AS ENUM ('DONO', 'ADMIN', 'MEMBRO');
CREATE TYPE "TemplateOrigin" AS ENUM ('SISTEMA', 'USUARIO', 'COMPARTILHADO');
CREATE TYPE "ParticipationRole" AS ENUM ('OWNER', 'MANAGER', 'EDITOR', 'REVIEWER', 'VIEWER');
CREATE TYPE "ProofingComponent" AS ENUM ('PLAYER_TIMESTAMP', 'PIN_IMAGEM', 'ESTAGIOS', 'COMPARACAO_LOTE');
CREATE TYPE "BriefingOrigin" AS ENUM ('HERDADO_DOSSIE', 'PREENCHIDO_MANUAL', 'SUGERIDO_IA_CONFIRMADO');
CREATE TYPE "ProjectStateEnum" AS ENUM ('ORCAMENTO', 'NEGOCIACAO', 'CONTRATO_ASSINADO', 'EM_PRODUCAO', 'ENTREGUE', 'CONCLUIDO', 'ARQUIVADO');
CREATE TYPE "DeliverableStateEnum" AS ENUM ('NAO_INICIADA', 'EM_PRODUCAO', 'EM_REVISAO', 'APROVADA', 'ENTREGUE');
CREATE TYPE "ApprovalState" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');
CREATE TYPE "ActivityType" AS ENUM ('COMENTARIO', 'ARQUIVO', 'APROVACAO', 'FINANCEIRO', 'SISTEMA', 'IA', 'COMPROMISSO', 'VERSAO');
CREATE TYPE "ActorType" AS ENUM ('PARTICIPACAO', 'SISTEMA', 'IA', 'INTEGRACAO');
CREATE TYPE "FinanceStatus" AS ENUM ('PENDENTE', 'AGENDADO', 'CONFIRMADO');

-- ───────────────────────── Camada Conta ─────────────────────────

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" "AccountType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people" (
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "document" TEXT,
    "languages" TEXT[] NOT NULL DEFAULT '{}',
    "availability" TEXT,
    "avatarUrl" TEXT,
    CONSTRAINT "people_pkey" PRIMARY KEY ("accountId")
);
CREATE UNIQUE INDEX "people_email_key" ON "people"("email");

CREATE TABLE "organizations" (
    "accountId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "restrictProjectCreation" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("accountId")
);
CREATE UNIQUE INDEX "organizations_document_key" ON "organizations"("document");

CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "internalRole" "InternalRole" NOT NULL,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_members_organizationId_personId_key" ON "organization_members"("organizationId", "personId");

-- ───────────────────── Camada Relacionamento ─────────────────────

CREATE TABLE "relationships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "accountAId" TEXT NOT NULL,
    "accountBId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "relationships_accountAId_accountBId_key" ON "relationships"("accountAId", "accountBId");

CREATE TABLE "dossiers" (
    "relationshipId" TEXT NOT NULL,
    "preferredPaymentMethod" TEXT,
    "defaultApprovers" JSONB,
    "brandAssets" JSONB,
    "defaultContractFileId" TEXT,
    "address" TEXT,
    "taxDocument" TEXT,
    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("relationshipId")
);

CREATE TABLE "messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "relationshipId" TEXT NOT NULL,
    "authorParticipationId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_relationshipId_createdAt_idx" ON "messages"("relationshipId", "createdAt");

-- ───────────────────────── Camada Projeto ─────────────────────────

CREATE TABLE "templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "createdByType" "TemplateOrigin" NOT NULL,
    "accountId" TEXT,
    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "template_versions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "deliverableStructure" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "template_versions_templateId_versionNumber_key" ON "template_versions"("templateId", "versionNumber");

CREATE TABLE "projects" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "relationshipId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "totalBudget" DECIMAL(12,2),
    "generalDeadline" TIMESTAMPTZ,
    "payerAccountId" TEXT NOT NULL,
    "payeeAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "projects_relationshipId_idx" ON "projects"("relationshipId");
CREATE INDEX "projects_payerAccountId_idx" ON "projects"("payerAccountId");
CREATE INDEX "projects_payeeAccountId_idx" ON "projects"("payeeAccountId");

CREATE TABLE "participations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" "ParticipationRole" NOT NULL,
    "deliverableId" TEXT,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participations_projectId_accountId_key" ON "participations"("projectId", "accountId");

-- ───────────────────────── Camada Entrega ─────────────────────────

CREATE TABLE "deliverable_types" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "technicalBriefingStructure" JSONB NOT NULL,
    "defaultSubtasks" JSONB NOT NULL,
    "proofingComponent" "ProofingComponent" NOT NULL,
    CONSTRAINT "deliverable_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "deliverable_types_name_key" ON "deliverable_types"("name");

CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "deliverableTypeId" TEXT NOT NULL,
    "jsonDefinition" JSONB NOT NULL,
    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workflow_definitions_deliverableTypeId_key" ON "workflow_definitions"("deliverableTypeId");

CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "deliverableTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "deliverables_projectId_idx" ON "deliverables"("projectId");

CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "deliverableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subtasks_deliverableId_idx" ON "subtasks"("deliverableId");

CREATE TABLE "briefing_responses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT,
    "deliverableId" TEXT,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "origin" "BriefingOrigin" NOT NULL,
    CONSTRAINT "briefing_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "briefing_responses_projectId_field_idx" ON "briefing_responses"("projectId", "field");
CREATE INDEX "briefing_responses_deliverableId_field_idx" ON "briefing_responses"("deliverableId", "field");

-- ───────────────────────── Camada Workflow ─────────────────────────

CREATE TABLE "project_states" (
    "projectId" TEXT NOT NULL,
    "state" "ProjectStateEnum" NOT NULL,
    "enteredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "project_states_pkey" PRIMARY KEY ("projectId")
);
CREATE INDEX "project_states_state_idx" ON "project_states"("state");

CREATE TABLE "deliverable_states" (
    "deliverableId" TEXT NOT NULL,
    "state" "DeliverableStateEnum" NOT NULL,
    "enteredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "deliverable_states_pkey" PRIMARY KEY ("deliverableId")
);
CREATE INDEX "deliverable_states_state_idx" ON "deliverable_states"("state");

CREATE TABLE "approvals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "activityId" TEXT NOT NULL,
    "state" "ApprovalState" NOT NULL DEFAULT 'PENDENTE',
    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "approvals_activityId_key" ON "approvals"("activityId");

CREATE TABLE "registered_decisions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "approvalId" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "registered_decisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "registered_decisions_approvalId_participationId_key" ON "registered_decisions"("approvalId", "participationId");

-- ───────────────── Camada Atividade / Timeline ─────────────────

CREATE TABLE "activities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT,
    "deliverableId" TEXT,
    "type" "ActivityType" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorParticipationId" TEXT,
    "payload" JSONB NOT NULL,
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "activities_projectId_createdAt_idx" ON "activities"("projectId", "createdAt");
CREATE INDEX "activities_deliverableId_createdAt_idx" ON "activities"("deliverableId", "createdAt");
CREATE INDEX "activities_type_idx" ON "activities"("type");

CREATE TABLE "stored_files" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "storageKey" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_references" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "fileId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    CONSTRAINT "file_references_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "file_references_activityId_idx" ON "file_references"("activityId");

-- ───────────────────────── Camada Financeiro ─────────────────────────

CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "deliverableId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "FinanceStatus" NOT NULL DEFAULT 'PENDENTE',
    "triggerActivityId" TEXT,
    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "finance_entries_projectId_status_idx" ON "finance_entries"("projectId", "status");

-- ───────────────────────── Foreign Keys ─────────────────────────

ALTER TABLE "people" ADD CONSTRAINT "people_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relationships" ADD CONSTRAINT "relationships_accountAId_fkey" FOREIGN KEY ("accountAId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_accountBId_fkey" FOREIGN KEY ("accountBId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "templates" ADD CONSTRAINT "templates_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "template_versions"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_payeeAccountId_fkey" FOREIGN KEY ("payeeAccountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_deliverableTypeId_fkey" FOREIGN KEY ("deliverableTypeId") REFERENCES "deliverable_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_deliverableTypeId_fkey" FOREIGN KEY ("deliverableTypeId") REFERENCES "deliverable_types"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "participations" ADD CONSTRAINT "participations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participations" ADD CONSTRAINT "participations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "participations" ADD CONSTRAINT "participations_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_authorParticipationId_fkey" FOREIGN KEY ("authorParticipationId") REFERENCES "participations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "briefing_responses" ADD CONSTRAINT "briefing_responses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "briefing_responses" ADD CONSTRAINT "briefing_responses_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_states" ADD CONSTRAINT "project_states_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliverable_states" ADD CONSTRAINT "deliverable_states_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activities" ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorParticipationId_fkey" FOREIGN KEY ("actorParticipationId") REFERENCES "participations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "approvals" ADD CONSTRAINT "approvals_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "registered_decisions" ADD CONSTRAINT "registered_decisions_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "registered_decisions" ADD CONSTRAINT "registered_decisions_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "file_references" ADD CONSTRAINT "file_references_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_references" ADD CONSTRAINT "file_references_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
