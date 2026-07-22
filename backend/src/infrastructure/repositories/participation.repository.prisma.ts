import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddParticipationInput,
  ParticipationRepository,
} from '../../domain/repositories/participation.repository';

@Injectable()
export class PrismaParticipationRepository implements ParticipationRepository {
  constructor(private readonly prisma: PrismaService) {}

  add(input: AddParticipationInput) {
    return this.prisma.participation.create({
      data: {
        projectId: input.projectId,
        accountId: input.accountId,
        role: input.role,
        deliverableId: input.deliverableId,
      },
    });
  }

  findByProjectAndAccount(projectId: string, accountId: string) {
    return this.prisma.participation.findUnique({
      where: { projectId_accountId: { projectId, accountId } },
    });
  }

  listByProject(projectId: string) {
    return this.prisma.participation.findMany({ where: { projectId } });
  }

  listByAccount(accountId: string) {
    return this.prisma.participation.findMany({ where: { accountId } });
  }
}
