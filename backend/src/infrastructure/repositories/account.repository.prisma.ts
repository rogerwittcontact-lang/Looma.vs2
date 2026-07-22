import { Injectable } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountRepository,
  CreateOrganizationAccountInput,
  CreatePersonAccountInput,
} from '../../domain/repositories/account.repository';

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPersonAccount(input: CreatePersonAccountInput) {
    return this.prisma.account.create({
      data: {
        type: AccountType.PESSOA,
        displayName: input.displayName,
        person: {
          create: {
            email: input.email,
            passwordHash: input.passwordHash,
          },
        },
      },
      include: { person: true },
    }) as any;
  }

  async createOrganizationAccount(input: CreateOrganizationAccountInput) {
    return this.prisma.account.create({
      data: {
        type: AccountType.ORGANIZACAO,
        displayName: input.displayName,
        organization: {
          create: {
            legalName: input.legalName,
            document: input.document,
          },
        },
      },
      include: { organization: true },
    }) as any;
  }

  findById(id: string) {
    return this.prisma.account.findUnique({ where: { id } });
  }

  findPersonByEmail(email: string) {
    return this.prisma.person.findUnique({
      where: { email },
      include: { account: true },
    }) as any;
  }

  findByType(type: AccountType) {
    return this.prisma.account.findMany({ where: { type } });
  }
}
