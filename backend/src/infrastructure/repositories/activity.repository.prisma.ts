import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActivityRepository,
  RecordActivityInput,
} from '../../domain/repositories/activity.repository';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  record(input: RecordActivityInput) {
    return this.prisma.activity.create({
      data: {
        projectId: input.projectId,
        deliverableId: input.deliverableId,
        type: input.type,
        actorType: input.actorType,
        actorParticipationId: input.actorParticipationId,
        payload: input.payload,
        payloadVersion: input.payloadVersion ?? 1,
      },
    });
  }

  getTimelineByProject(projectId: string) {
    return this.prisma.activity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  getTimelineByDeliverable(deliverableId: string) {
    return this.prisma.activity.findMany({
      where: { deliverableId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
