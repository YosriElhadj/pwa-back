import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PantryDocument = Pantry & Document;

@Schema({ timestamps: true })
export class Pantry {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  quantity: string;

  @Prop()
  unit: string;

  @Prop()
  category: string;

  @Prop()
  expiryDate?: Date;

  @Prop()
  imageUrl?: string;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop({ default: false })
  isExpired: boolean;
}

export const PantrySchema = SchemaFactory.createForClass(Pantry);