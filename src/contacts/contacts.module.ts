import { Module, forwardRef } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { LeadsModule } from 'src/leads/leads.module';
import { LeadsService } from 'src/leads/leads.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LeadsModule),
    HttpModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService, AuthService, LeadsService],
})
export class ContactsModule {}
