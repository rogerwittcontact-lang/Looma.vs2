import { Activity, ActivityType, ActorType, Prisma } from '@prisma/client';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export interface RecordActivityInput {
  projectId?: string;
  deliverableId?: string;
  type: ActivityType;
  actorType: ActorType;
  actorParticipationId?: string;
  payload: Prisma.InputJsonValue;
  payloadVersion?: number;
}

export interface ActivityRepository {
  /**
   * ADR-003: Atividade é imutável. Este é o único método de escrita —
   * não existe update() nem delete() nesta interface por design.
   */
  record(input: RecordActivityInput): Promise<Activity>;
  getTimelineByProject(projectId: string): Promise<Activity[]>;
  getTimelineByDeliverable(deliverableId: string): Promise<Activity[]>;
}
