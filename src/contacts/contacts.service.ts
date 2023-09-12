import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';

type ContactDto = {
  email: string;
  phone: string;
  name: string;
};

@Injectable()
export class ContactsService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async requestContact({ email, phone }: { email?: string; phone?: string }) {
    const tokens = await this.authService.getTokens();
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };

    // TODO: fix search: search by query is not trustful, could find by partial phone: 1234 === 1234567
    const data = await firstValueFrom(
      this.httpService
        .get(this.configService.get('AMO_CONTACTS_URI'), {
          params: { query: email || phone },
          headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            // supposed to be some logger...
            console.log(error.response?.data);
            throw new NotFoundException(error.response?.data);
          }),
        ),
    );

    return data?.data ?? null;
  }

  async findContact({ email, phone }: { email: string; phone: string }) {
    const dataByEmail = await this.requestContact({ email });

    if (dataByEmail) {
      return dataByEmail;
    }

    const dataByPhone = await this.requestContact({ phone });

    return dataByPhone ?? null;
  }

  async createContact({ email, phone, name }: ContactDto) {
    const tokens = await this.authService.getTokens();
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };

    const data = await firstValueFrom(
      this.httpService
        .post(
          this.configService.get('AMO_CONTACTS_URI'),
          {
            data: {
              name,
              custom_fields_values: [
                {
                  field_code: 'PHONE',
                  values: [
                    {
                      value: phone,
                      enum_id: 4808113,
                      enum_code: 'WORK',
                    },
                  ],
                },
                {
                  field_code: 'EMAIL',
                  values: [
                    {
                      value: email,
                      enum_id: 4808125,
                      enum_code: 'WORK',
                    },
                  ],
                },
              ],
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
            throw new NotFoundException(error.response.data);
          }),
        ),
    );

    return data?.data ?? null;
  }

  async updateContact({ email, phone, name }: ContactDto, id: number) {
    const tokens = await this.authService.getTokens();
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };

    const data = await firstValueFrom(
      this.httpService
        .patch(
          `${this.configService.get('AMO_CONTACTS_URI')}/${id}`,
          {
            data: {
              name,
              custom_fields_values: [
                {
                  field_code: 'PHONE',
                  values: [
                    {
                      value: phone,
                      enum_id: 4808113,
                      enum_code: 'WORK',
                    },
                  ],
                },
                {
                  field_code: 'EMAIL',
                  values: [
                    {
                      value: email,
                      enum_id: 4808125,
                      enum_code: 'WORK',
                    },
                  ],
                },
              ],
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
            throw new NotFoundException(error.response.data);
          }),
        ),
    );

    return data?.data ?? null;
  }
}
