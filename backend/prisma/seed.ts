import {
  PrismaClient,
  AccountType,
  TemplateOrigin,
  ProofingComponent,
  ParticipationRole,
  ProjectStateEnum,
  DeliverableStateEnum,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ── Catálogo de Tipos de Entrega (dado de sistema, não de usuário) ──
  const videoType = await prisma.deliverableType.upsert({
    where: { name: 'VIDEO' },
    update: {},
    create: {
      name: 'VIDEO',
      technicalBriefingStructure: {
        campos: ['duracao', 'formato', 'captacao', 'drone', 'locucao', 'trilha', 'legendas'],
      },
      defaultSubtasks: {
        itens: ['Roteiro', 'Captação', 'Edição', 'Color', 'Legenda', 'Render'],
      },
      proofingComponent: ProofingComponent.PLAYER_TIMESTAMP,
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { deliverableTypeId: videoType.id },
    update: {},
    create: {
      deliverableTypeId: videoType.id,
      jsonDefinition: {
        cliente: 'PRIMEIRA_DECISAO_VENCE',
      },
    },
  });

  const fotoType = await prisma.deliverableType.upsert({
    where: { name: 'FOTO' },
    update: {},
    create: {
      name: 'FOTO',
      technicalBriefingStructure: {
        campos: ['local', 'equipamentos', 'iluminacao', 'modelos', 'figurino'],
      },
      defaultSubtasks: { itens: ['Pré-produção', 'Captação', 'Seleção', 'Edição'] },
      proofingComponent: ProofingComponent.COMPARACAO_LOTE,
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { deliverableTypeId: fotoType.id },
    update: {},
    create: {
      deliverableTypeId: fotoType.id,
      jsonDefinition: { cliente: 'PRIMEIRA_DECISAO_VENCE' },
    },
  });

  const designType = await prisma.deliverableType.upsert({
    where: { name: 'DESIGN' },
    update: {},
    create: {
      name: 'DESIGN',
      technicalBriefingStructure: {
        campos: ['marca', 'objetivo', 'concorrentes', 'publico', 'cores', 'aplicacoes'],
      },
      defaultSubtasks: { itens: ['Pesquisa', 'Conceito', 'Refinamento', 'Entrega final'] },
      proofingComponent: ProofingComponent.PIN_IMAGEM,
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { deliverableTypeId: designType.id },
    update: {},
    create: {
      deliverableTypeId: designType.id,
      jsonDefinition: { cliente: 'PRIMEIRA_DECISAO_VENCE' },
    },
  });

  // ── Template de sistema: Campanha ──
  const template = await prisma.template.upsert({
    where: { id: 'seed-template-campanha' },
    update: {},
    create: {
      id: 'seed-template-campanha',
      name: 'Campanha',
      createdByType: TemplateOrigin.SISTEMA,
    },
  });

  const templateVersion = await prisma.templateVersion.upsert({
    where: { templateId_versionNumber: { templateId: template.id, versionNumber: 1 } },
    update: {},
    create: {
      templateId: template.id,
      versionNumber: 1,
      deliverableStructure: {
        entregas: [
          { deliverableTypeId: videoType.id, nome: 'Vídeo Hero' },
          { deliverableTypeId: fotoType.id, nome: 'Fotos Lifestyle' },
          { deliverableTypeId: designType.id, nome: 'Banners' },
        ],
      },
    },
  });

  // ── Contas de exemplo ──
  const passwordHash = await bcrypt.hash('senha123', 10);

  const rogerAccount = await prisma.account.upsert({
    where: { id: 'seed-account-roger' },
    update: {},
    create: {
      id: 'seed-account-roger',
      type: AccountType.PESSOA,
      displayName: 'Roger (Fotógrafo)',
      person: {
        create: {
          accountId: 'seed-account-roger',
          email: 'roger@example.com',
          passwordHash,
          languages: ['pt', 'en'],
        },
      },
    },
  });

  const laghettoAccount = await prisma.account.upsert({
    where: { id: 'seed-account-laghetto' },
    update: {},
    create: {
      id: 'seed-account-laghetto',
      type: AccountType.ORGANIZACAO,
      displayName: 'Laghetto Hotéis',
      organization: {
        create: {
          accountId: 'seed-account-laghetto',
          legalName: 'Laghetto Hotéis S.A.',
          document: '00.000.000/0001-00',
        },
      },
    },
  });

  // ── Relacionamento entre as duas contas ──
  const [a, b] = [rogerAccount.id, laghettoAccount.id].sort();
  const relationship = await prisma.relationship.upsert({
    where: { accountAId_accountBId: { accountAId: a, accountBId: b } },
    update: {},
    create: { accountAId: a, accountBId: b },
  });

  await prisma.dossier.upsert({
    where: { relationshipId: relationship.id },
    update: {},
    create: {
      relationshipId: relationship.id,
      preferredPaymentMethod: 'PIX',
      defaultApprovers: [{ personId: rogerAccount.id }],
      brandAssets: { cores: ['#0D1117', '#2E6BFF'], fontes: ['Sora'] },
    },
  });

  // ── Projeto de exemplo, já em produção ──
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-campanha-verao' },
    update: {},
    create: {
      id: 'seed-project-campanha-verao',
      relationshipId: relationship.id,
      templateVersionId: templateVersion.id,
      name: 'Campanha Verão',
      objective: 'Lançamento da nova temporada',
      totalBudget: 45000,
      payerAccountId: laghettoAccount.id,
      payeeAccountId: rogerAccount.id,
    },
  });

  await prisma.projectState.upsert({
    where: { projectId: project.id },
    update: {},
    create: { projectId: project.id, state: ProjectStateEnum.EM_PRODUCAO },
  });

  const videoDeliverable = await prisma.deliverable.upsert({
    where: { id: 'seed-deliverable-video-hero' },
    update: {},
    create: {
      id: 'seed-deliverable-video-hero',
      projectId: project.id,
      deliverableTypeId: videoType.id,
      name: 'Vídeo Hero',
    },
  });

  await prisma.deliverableState.upsert({
    where: { deliverableId: videoDeliverable.id },
    update: {},
    create: { deliverableId: videoDeliverable.id, state: DeliverableStateEnum.EM_REVISAO },
  });

  await prisma.participation.upsert({
    where: { projectId_accountId: { projectId: project.id, accountId: rogerAccount.id } },
    update: {},
    create: {
      projectId: project.id,
      accountId: rogerAccount.id,
      role: ParticipationRole.OWNER,
    },
  });

  await prisma.participation.upsert({
    where: { projectId_accountId: { projectId: project.id, accountId: laghettoAccount.id } },
    update: {},
    create: {
      projectId: project.id,
      accountId: laghettoAccount.id,
      role: ParticipationRole.REVIEWER,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed concluído: catálogo de Tipos de Entrega, Template "Campanha" v1,');
  console.log('contas Roger/Laghetto, Relacionamento, Dossiê e Projeto de exemplo.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
