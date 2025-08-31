import { InputType, Field } from '@nestjs/graphql';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ArrayUnique,
  ArrayNotEmpty,
  IsArray,
} from 'class-validator';

@InputType()
export class CreateChatInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  isGroup: boolean;

  // @Field({ nullable: true })
  // @IsUUID()
  // createdById: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  participantIds?: string[];
}
