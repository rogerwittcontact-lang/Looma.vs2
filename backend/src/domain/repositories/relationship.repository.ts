import { Relationship, Dossier } from '@prisma/client';

export const RELATIONSHIP_REPOSITORY = Symbol('RELATIONSHIP_REPOSITORY');

export interface RelationshipRepository {
  /**
   * ADR-000 (implícita no domínio): Relacionamento nasce automaticamente
   * na primeira interação entre duas Contas. Este método é idempotente —
   * se já existir um Relacionamento entre as duas Contas (em qualquer
   * ordem), retorna o existente em vez de criar um novo.
   */
  findOrCreateBetween(accountAId: string, accountBId: string): Promise<Relationship>;
  findById(id: string): Promise<Relationship | null>;
  findDossier(relationshipId: string): Promise<Dossier | null>;
  upsertDossier(
    relationshipId: string,
    data: Partial<Omit<Dossier, 'relationshipId'>>,
  ): Promise<Dossier>;
  listForAccount(accountId: string): Promise<Relationship[]>;
}
