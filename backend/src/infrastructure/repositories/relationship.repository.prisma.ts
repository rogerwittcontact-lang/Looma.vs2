import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RelationshipRepository } from '../../domain/repositories/relationship.repository';
import { Dossier } from '@prisma/client';

@Injectable()
export class PrismaRelationshipRepository implements RelationshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateBetween(accountAId: string, accountBId: string) {
    // Normaliza a ordem para que (A,B) e (B,A) sempre resolvam
    // para a mesma linha, respeitando a constraint única do schema.
    const [first, second] = [accountAId, accountBId].sort();

    const existing = await this.prisma.relationship.findUnique({
      where: { accountAId_accountBId: { accountAId: first, accountBId: second } },
    });
    if (existing) return existing;

    return this.prisma.relationship.create({
      data: { accountAId: first, accountBId: second },
    });
  }

  findById(id: string) {
    return this.prisma.relationship.findUnique({ where: { id } });
  }

  findDossier(relationshipId: string) {
    return this.prisma.dossier.findUnique({ where: { relationshipId } });
  }

  upsertDossier(relationshipId: string, data: Partial<Omit<Dossier, 'relationshipId'>>) {
    return this.prisma.dossier.upsert({
      where: { relationshipId },
      create: { relationshipId, ...data },
      update: data,
    });
  }

  listForAccount(accountId: string) {
    return this.prisma.relationship.findMany({
      where: {
        OR: [{ accountAId: accountId }, { accountBId: accountId }],
      },
    });
  }
}
