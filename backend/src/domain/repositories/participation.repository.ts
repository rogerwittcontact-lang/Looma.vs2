import { Participation, ParticipationRole } from '@prisma/client';

export const PARTICIPATION_REPOSITORY = Symbol('PARTICIPATION_REPOSITORY');

export interface AddParticipationInput {
  projectId: string;
  accountId: string;
  role: ParticipationRole;
  deliverableId?: string;
}

export interface ParticipationRepository {
  add(input: AddParticipationInput): Promise<Participation>;
  findByProjectAndAccount(
    projectId: string,
    accountId: string,
  ): Promise<Participation | null>;
  listByProject(projectId: string): Promise<Participation[]>;
  listByAccount(accountId: string): Promise<Participation[]>;
}
