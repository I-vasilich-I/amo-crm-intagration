import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}
  async createLead(contactId: number) {
    const tokens = await this.authService.getTokens();
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };

    const data = await firstValueFrom(
      this.httpService
        .post(
          `${this.configService.get('AMO_API_URI')}/leads`,
          {
            data: {
              name: `Deal-${Math.floor(Math.random() * 10)}`,
              _embedded: {
                contacts: [
                  {
                    id: contactId,
                  },
                ],
              },
            },
          },
          {
            headers,
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            // supposed to be some logger...
            console.log(error.response.data);
            throw new BadRequestException(error.response.data);
          }),
        ),
    );

    return data?.data ?? null;
  }
}
