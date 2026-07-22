import { Module } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository';
import { RELATIONSHIP_REPOSITORY } from '../../domain/repositories/relationship.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { PARTICIPATION_REPOSITORY } from '../../domain/repositories/participation.repository';
import { ACTIVITY_REPOSITORY } from '../../domain/repositories/activity.repository';

import { PrismaAccountRepository } from './account.repository.prisma';
import { PrismaRelationshipRepository } from './relationship.repository.prisma';
import { PrismaProjectRepository } from './project.repository.prisma';
import { PrismaParticipationRepository } from './participation.repository.prisma';
import { PrismaActivityRepository } from './activity.repository.prisma';

// Este módulo é o único lugar do sistema que sabe que os repositories
// são implementados com Prisma. Use Cases (Sprint 2) e Controllers
// dependem apenas dos tokens/interfaces acima, nunca desta classe.
@Module({
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: RELATIONSHIP_REPOSITORY, useClass: PrismaRelationshipRepository },
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: PARTICIPATION_REPOSITORY, useClass: PrismaParticipationRepository },
    { provide: ACTIVITY_REPOSITORY, useClass: PrismaActivityRepository },
  ],
  exports: [
    ACCOUNT_REPOSITORY,
    RELATIONSHIP_REPOSITORY,
    PROJECT_REPOSITORY,
    PARTICIPATION_REPOSITORY,
    ACTIVITY_REPOSITORY,
  ],
})
export class RepositoriesModule {}
