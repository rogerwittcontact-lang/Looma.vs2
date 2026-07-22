import { Account, AccountType, Person, Organization } from '@prisma/client';

export interface CreatePersonAccountInput {
  displayName: string;
  email: string;
  passwordHash: string;
}

export interface CreateOrganizationAccountInput {
  displayName: string;
  legalName: string;
  document: string;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepository {
  createPersonAccount(input: CreatePersonAccountInput): Promise<Account & { person: Person }>;
  createOrganizationAccount(
    input: CreateOrganizationAccountInput,
  ): Promise<Account & { organization: Organization }>;
  findById(id: string): Promise<Account | null>;
  findPersonByEmail(email: string): Promise<(Person & { account: Account }) | null>;
  findByType(type: AccountType): Promise<Account[]>;
}
