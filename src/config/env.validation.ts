import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV: string = 'development';

  @IsString()
  @IsNotEmpty()
  MONGO_URI: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsNumber()
  @Min(1000)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  ALLOWED_ORIGINS: string = 'http://localhost:5173';

  @IsOptional()
  @IsString()
  BOOTSTRAP_ADMIN_NAME: string = 'admin';

  @IsOptional()
  @IsString()
  BOOTSTRAP_ADMIN_EMAIL: string = 'admin@example.com';

  @IsOptional()
  @IsString()
  BOOTSTRAP_ADMIN_PASSWORD: string = '';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const normalizedConfig = {
    ...config,
    MONGO_URI: config.MONGO_URI ?? config.MONGODB_URI,
  };

  const validatedConfig = plainToClass(EnvironmentVariables, normalizedConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
