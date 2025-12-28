import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Ejecutar este test antes que los demás para evitar contaminación de estado
jest.setTimeout(5000);

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockAppService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('raíz', () => {
    it('debería retornar "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appService.getHello).toHaveBeenCalled();
    });

    it('debería tener AppController definido', () => {
      expect(appController).toBeDefined();
    });
  });
});
