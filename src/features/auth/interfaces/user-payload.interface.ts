import { Role } from '../../user/enums/role.enum';

export interface UserPayload {
  _id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
  CreatedAt?: Date;
  UpdatedAt?: Date;
}

export interface UserLoginResult {
  success: boolean;
  user?: UserPayload;
  message?: string;
}
