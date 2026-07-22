import { Prisma, Relationship, Dossier } from '@prisma/client';

export const RELATIONSHIP_REPOSITORY = Symbol('RELATIONSHIP_REPOSITORY');

export interface RelationshipRepository {
  findOrCreateBetween(
    accountAId: string,
    accountBId: string,
  ): Promise<Relationship>;

  findById(id: string): Promise<Relationship | null>;

  findDossier(relationshipId: string): Promise<Dossier | null>;

export type UpsertDossierData = {
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

upsertDossier(
  relationshipId: string,
  data: UpsertDossierData,
): Promise<Dossier>;

  listForAccount(accountId: string): Promise<Relationship[]>;
}
