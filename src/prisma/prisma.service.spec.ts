import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test_database_url'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    service.$connect = jest.fn();
    service.$disconnect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call ConfigService.get with DATABASE_URL in constructor', () => {
    expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('should call connect on onModuleInit', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('should call disconnect on onModuleDestroy', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });
});
