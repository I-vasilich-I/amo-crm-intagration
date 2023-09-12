type AuthQuery = {
  code: string;
  referer: string;
  platform: string;
  client_id: string;
  from_widget: string;
};

enum GrantType {
  AuthCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export type { AuthQuery };

export { GrantType };
