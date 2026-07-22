import { PrismaActivityRepository } from './activity.repository.prisma';
import { ActivityType, ActorType } from '@prisma/client';

describe('PrismaActivityRepository', () => {
  const prismaMock = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let repository: PrismaActivityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaActivityRepository(prismaMock as any);
  });

  it('records an activity with default payloadVersion = 1 when not provided', async () => {
    prismaMock.activity.create.mockResolvedValue({ id: 'act-1' });

    await repository.record({
      projectId: 'proj-1',
      type: ActivityType.COMENTARIO,
      actorType: ActorType.PARTICIPACAO,
      actorParticipationId: 'part-1',
      payload: { texto: 'ok' },
    });

    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ payloadVersion: 1 }),
    });
  });

  it('does not expose update or delete methods (ADR-003: Atividade é imutável)', () => {
    expect((repository as any).update).toBeUndefined();
    expect((repository as any).delete).toBeUndefined();
  });

  it('retrieves project timeline ordered chronologically ascending', async () => {
    prismaMock.activity.findMany.mockResolvedValue([]);

    await repository.getTimelineByProject('proj-1');

    expect(prismaMock.activity.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
