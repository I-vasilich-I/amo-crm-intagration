import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { GrantType } from 'src/types';
import { Auth } from '@prisma/client';

type Tokens = {
  token_type: 'Bearer';
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

type TokensParams = {
  client_id: string;
  client_secret: string;
  grant_type: GrantType;
  code?: string;
  refresh_token?: string;
  redirect_uri: string;
};

type RequestProps = {
  grantType: GrantType;
  refreshToken?: string;
  code?: string;
};

@Injectable()
export class AuthService {
  #code: string | null = null;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  getCode() {
    return this.#code;
  }

  setCode(value: string) {
    this.#code = value;
  }

  private async requestTokens({ grantType, refreshToken, code }: RequestProps) {
    const params: TokensParams = {
      client_id: this.configService.get('AMO_INTEGRATION_ID'),
      client_secret: this.configService.get('AMO_SECRET_KEY'),
      redirect_uri: this.configService.get('AMO_REDIRECT_URI'),
      grant_type: grantType,
    };

    if (grantType === GrantType.AuthCode) {
      params.code = code;
    }

    if (grantType === GrantType.RefreshToken) {
      params.refresh_token = refreshToken;
    }

    const data = await firstValueFrom(
      this.httpService
        .post<Tokens>(this.configService.get('AMO_ACCESS_TOKEN_URI'), params)
        .pipe(
          catchError((error: AxiosError) => {
            // supposed to be some logger...
            console.log(error?.response?.data);
            throw new BadRequestException(error?.response?.data);
          }),
        ),
    );

    return data?.data ?? null;
  }

  async setTokens() {
    const data = await this.requestTokens({
      grantType: GrantType.AuthCode,
      code: this.getCode(),
    });

    if (!data) {
      throw new BadRequestException('no tokens were granted');
    }

    const { refresh_token, access_token, expires_in } = data;

    const newTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    };

    // will have only one row in db, so update or create
    const savedTokens = await this.prisma.auth.upsert({
      where: { id: 1 },
      update: newTokens,
      create: newTokens,
    });

    return savedTokens;
  }

  async getTokens() {
    const tokens = await this.prisma.auth.findUnique({ where: { id: 1 } });

    const isTokensValid = tokens && this.isValidTokens(tokens);

    if (!isTokensValid) {
      const newTokens = await this.refreshTokens(tokens.refreshToken);
      return newTokens;
    }

    return tokens;
  }

  async refreshTokens(refreshToken: string) {
    const data = await this.requestTokens({
      grantType: GrantType.RefreshToken,
      refreshToken,
    });

    if (!data) {
      console.log('need to request access code again....');
      return;
    }

    const { refresh_token, access_token, expires_in } = data;

    const newTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    };

    await this.prisma.auth.update({
      where: { id: 1 },
      data: newTokens,
    });

    return newTokens;
  }

  isValidTokens(tokens: Auth): boolean {
    const now = new Date();
    const timestamp = new Date(tokens.timestamp);
    const diff = now.getTime() - timestamp.getTime();

    return diff < tokens.expiresIn;
  }
}
