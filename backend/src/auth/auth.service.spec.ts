import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { ACCOUNT_REPOSITORY } from '../domain/repositories/account.repository';

describe('AuthService', () => {
  let service: AuthService;
  const accountRepositoryMock = {
    findPersonByEmail: jest.fn(),
    createPersonAccount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepositoryMock },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('rejects when e-mail already exists', async () => {
      accountRepositoryMock.findPersonByEmail.mockResolvedValue({
        accountId: 'existing',
      });

      await expect(
        service.register({
          displayName: 'Roger',
          email: 'roger@example.com',
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates account and returns token pair', async () => {
      accountRepositoryMock.findPersonByEmail.mockResolvedValue(null);
      accountRepositoryMock.createPersonAccount.mockResolvedValue({
        id: 'new-account-id',
      });

      const result = await service.register({
        displayName: 'Roger',
        email: 'roger@example.com',
        password: 'senha1234',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
      expect(accountRepositoryMock.createPersonAccount).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'roger@example.com' }),
      );
    });
  });

  describe('login', () => {
    it('rejects when account does not exist', async () => {
      accountRepositoryMock.findPersonByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when password does not match', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      accountRepositoryMock.findPersonByEmail.mockResolvedValue({
        accountId: 'acc-1',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'roger@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns token pair on valid credentials', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      accountRepositoryMock.findPersonByEmail.mockResolvedValue({
        accountId: 'acc-1',
        passwordHash: hash,
      });

      const result = await service.login({
        email: 'roger@example.com',
        password: 'correct-password',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });
});
