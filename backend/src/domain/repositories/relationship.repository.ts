import { Prisma, Relationship, Dossier } from '@prisma/client';

export const RELATIONSHIP_REPOSITORY = Symbol('RELATIONSHIP_REPOSITORY');

export type UpsertDossierData = {
  preferredPaymentMethod?: string | null;
  defaultApprovers?: Prisma.InputJsonValue;
  brandAssets?: Prisma.InputJsonValue;
  defaultContractFileId?: string | null;
  address?: string | null;
  taxDocument?: string | null;
};

export interface RelationshipRepository {
  findOrCreateBetween(
    accountAId: string,
    accountBId: string,
  ): Promise<Relationship>;

  findById(id: string): Promise<Relationship | null>;

  findDossier(
    relationshipId: string,
  ): Promise<Dossier | null>;

  upsertDossier(
    relationshipId: string,
    data: UpsertDossierData,
  ): Promise<Dossier>;

  listForAccount(
    accountId: string,
  ): Promise<Relationship[]>;
}
