import { Project, ProjectStateEnum } from '@prisma/client';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface CreateProjectInput {
  relationshipId: string;
  templateVersionId: string;
  name: string;
  objective?: string;
  totalBudget?: number;
  generalDeadline?: Date;
  payerAccountId: string;
  payeeAccountId: string;
}

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  listByRelationship(relationshipId: string): Promise<Project[]>;
  listActiveByAccount(accountId: string): Promise<Project[]>;
  getState(projectId: string): Promise<ProjectStateEnum | null>;
  setState(projectId: string, state: ProjectStateEnum): Promise<void>;
}
