import { Test, TestingModule } from '@nestjs/testing';
import { ChargerService } from './charger.service';

describe('ChargerService', () => {
  let service: ChargerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargerService],
    }).compile();

    service = module.get<ChargerService>(ChargerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
