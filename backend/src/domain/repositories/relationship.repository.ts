import { Prisma, Relationship, Dossier } from '@prisma/client';

export const RELATIONSHIP_REPOSITORY = Symbol('RELATIONSHIP_REPOSITORY');

export interface RelationshipRepository {
  findOrCreateBetween(
    accountAId: string,
    accountBId: string,
  ): Promise<Relationship>;

  findById(id: string): Promise<Relationship | null>;

  findDossier(relationshipId: string): Promise<Dossier | null>;

  upsertDossier(
    relationshipId: string,
    data: Prisma.DossierCreateInput,
  ): Promise<Dossier>;

  listForAccount(accountId: string): Promise<Relationship[]>;
}
