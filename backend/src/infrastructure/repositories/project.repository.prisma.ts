import { Injectable } from '@nestjs/common';
import { ProjectStateEnum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProjectInput,
  ProjectRepository,
} from '../../domain/repositories/project.repository';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateProjectInput) {
    return this.prisma.project.create({
      data: {
        relationshipId: input.relationshipId,
        templateVersionId: input.templateVersionId,
        name: input.name,
        objective: input.objective,
        totalBudget: input.totalBudget,
        generalDeadline: input.generalDeadline,
        payerAccountId: input.payerAccountId,
        payeeAccountId: input.payeeAccountId,
      },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  listByRelationship(relationshipId: string) {
    return this.prisma.project.findMany({ where: { relationshipId } });
  }

  async listActiveByAccount(accountId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [{ payerAccountId: accountId }, { payeeAccountId: accountId }],
        state: {
          state: {
            notIn: [ProjectStateEnum.CONCLUIDO, ProjectStateEnum.ARQUIVADO],
          },
        },
      },
    });
  }

  async getState(projectId: string) {
    const state = await this.prisma.projectState.findUnique({
      where: { projectId },
    });
    return state?.state ?? null;
  }

  async setState(projectId: string, state: ProjectStateEnum) {
    await this.prisma.projectState.upsert({
      where: { projectId },
      create: { projectId, state },
      update: { state, enteredAt: new Date() },
    });
  }
}
