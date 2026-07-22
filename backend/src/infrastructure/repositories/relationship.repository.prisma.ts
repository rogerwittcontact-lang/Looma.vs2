import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RelationshipRepository } from '../../domain/repositories/relationship.repository';
type UpsertDossierData = {
  preferredPaymentMethod?: string | null;
  defaultApprovers?:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput;
  brandAssets?:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput;
  defaultContractFileId?: string | null;
  address?: string | null;
  taxDocument?: string | null;
};

@Injectable()
export class PrismaRelationshipRepository
  implements RelationshipRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateBetween(accountAId: string, accountBId: string) {
    const [first, second] = [accountAId, accountBId].sort();

    const existing = await this.prisma.relationship.findUnique({
      where: {
        accountAId_accountBId: {
          accountAId: first,
          accountBId: second,
        },
      },
    });

    if (existing) return existing;

    return this.prisma.relationship.create({
      data: {
        accountAId: first,
        accountBId: second,
      },
    });
  }

  findById(id: string) {
    return this.prisma.relationship.findUnique({
      where: { id },
    });
  }

  findDossier(relationshipId: string) {
    return this.prisma.dossier.findUnique({
      where: { relationshipId },
    });
  }

upsertDossier(
  relationshipId: string,
  data: UpsertDossierData,
) {
  return this.prisma.dossier.upsert({
    where: {
      relationshipId,
    },
    create: {
      relationshipId,
      ...data,
    },
    update: {
      preferredPaymentMethod: data.preferredPaymentMethod,
      defaultApprovers: data.defaultApprovers,
      brandAssets: data.brandAssets,
      defaultContractFileId: data.defaultContractFileId,
      address: data.address,
      taxDocument: data.taxDocument,
    },
  });
}

  listForAccount(accountId: string) {
    return this.prisma.relationship.findMany({
      where: {
        OR: [
          { accountAId: accountId },
          { accountBId: accountId },
        ],
      },
    });
  }
}
