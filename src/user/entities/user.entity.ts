import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role of the user',
});

@ObjectType()
export class User {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  isEmailVerified: boolean;

  @Field(() => UserRole)
  role: UserRole;

  @Field({ nullable: true })
  isPaid: boolean;

  @Field({ nullable: true })
  isActive: boolean;

  @Field({ nullable: true })
  otp?: string;

  @Field({ nullable: true })
  otpExpiresAt?: Date;

  @Field({ nullable: true })
  isGoogleUser: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  lastActivityAt?: Date;

  @Field({ nullable: true })
  failedLoginAttempts: number;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;

  @Field({ nullable: true })
  deletedAt?: Date;
}
