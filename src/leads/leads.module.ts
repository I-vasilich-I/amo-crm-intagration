import { Module, forwardRef } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [forwardRef(() => AuthModule), HttpModule],
  providers: [LeadsService, AuthService],
})
export class LeadsModule {}
