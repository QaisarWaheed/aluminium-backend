import { Role } from '../../user/enums/role.enum';

export interface JwtPayload {
  email: string;
  sub: string; // user id
  name: string;
  role: Role;
}

export interface UserFromJwt {
  userId: string;
  email: string;
  name: string;
  role: Role;
}
