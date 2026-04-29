import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailService } from './modules/auth/email.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      ok: true,
      message: 'Backend funcionando correctamente',
      email: this.emailService.getConfigurationStatus(),
    };
  }
}
