import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    _id: string;
    email: string;
    name: string;
  };
}
