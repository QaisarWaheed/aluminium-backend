export interface JwtPayload {
  email: string;
  sub: string; // user id
  name: string;
}

export interface UserFromJwt {
  userId: string;
  email: string;
  name: string;
}
