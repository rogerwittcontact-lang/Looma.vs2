import { PrismaRelationshipRepository } from './relationship.repository.prisma';

describe('PrismaRelationshipRepository', () => {
  const prismaMock = {
    relationship: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  let repository: PrismaRelationshipRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaRelationshipRepository(prismaMock as any);
  });

  it('returns the existing Relationship when one already exists between the two accounts', async () => {
    prismaMock.relationship.findUnique.mockResolvedValue({
      id: 'rel-1',
      accountAId: 'acc-1',
      accountBId: 'acc-2',
    });

    const result = await repository.findOrCreateBetween('acc-2', 'acc-1');

    expect(result.id).toBe('rel-1');
    expect(prismaMock.relationship.create).not.toHaveBeenCalled();
  });

  it('creates a new Relationship with normalized (sorted) account order', async () => {
    prismaMock.relationship.findUnique.mockResolvedValue(null);
    prismaMock.relationship.create.mockResolvedValue({
      id: 'rel-new',
      accountAId: 'acc-1',
      accountBId: 'acc-2',
    });

    await repository.findOrCreateBetween('acc-2', 'acc-1');

    expect(prismaMock.relationship.create).toHaveBeenCalledWith({
      data: { accountAId: 'acc-1', accountBId: 'acc-2' },
    });
  });

  it('is idempotent regardless of argument order (ADR: Relacionamento nasce automaticamente)', async () => {
    prismaMock.relationship.findUnique.mockResolvedValue({
      id: 'rel-1',
      accountAId: 'acc-1',
      accountBId: 'acc-2',
    });

    const resultOrderOne = await repository.findOrCreateBetween('acc-1', 'acc-2');
    const resultOrderTwo = await repository.findOrCreateBetween('acc-2', 'acc-1');

    expect(resultOrderOne.id).toBe(resultOrderTwo.id);
  });
});
