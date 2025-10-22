import { Test, TestingModule } from '@nestjs/testing';
import { ChargerController } from './charger.controller';

describe('ChargerController', () => {
  let controller: ChargerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargerController],
    }).compile();

    controller = module.get<ChargerController>(ChargerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
