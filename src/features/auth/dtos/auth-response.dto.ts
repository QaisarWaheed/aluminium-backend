import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../user/enums/role.enum';

export class AuthResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  user!: {
    _id: string;
    email: string;
    name: string;
    role: Role;
  };
}
