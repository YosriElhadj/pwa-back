import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecipeDocument = Recipe & Document;

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true })
  prepTime: number;

  @Prop({ type: [{ name: String, quantity: String }], required: true })
  ingredients: { name: string; quantity: string }[];

  @Prop({ type: [String], required: true })
  steps: string[];

  @Prop()
  image?: string;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);