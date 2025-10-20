import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecipeDocument = Recipe & Document;

// Comment subdocument schema
@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop()
  userAvatar?: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Informations de base
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true })
  prepTime: number;

  // UPDATED: Ingredients with nutrition data
  @Prop({
    type: [{
      name: String,
      quantity: String,
      foodId: String,
      calories: Number,
      protein: Number,
      fat: Number,
      carbs: Number,
    }],
    required: true,
  })
  ingredients: {
    name: string;
    quantity: string;
    foodId?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  }[];

  @Prop({ type: [String], required: true })
  steps: string[];

  @Prop()
  image?: string;

  @Prop({ default: false })
  isFavorite: boolean;

  // PROPRIÉTÉS SOCIALES
  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // Commentaires
  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];

  // NEW: Nutrition totals
  @Prop({ default: 0 })
  totalCalories: number;

  @Prop({ default: 0 })
  totalProtein: number;

  @Prop({ default: 0 })
  totalFat: number;

  @Prop({ default: 0 })
  totalCarbs: number;

  // Informations de l'auteur
  @Prop()
  authorName: string;

  @Prop()
  authorAvatar?: string;

  // Timestamps
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

// Index pour recherche et performance
RecipeSchema.index({ isPublic: 1, createdAt: -1 });
RecipeSchema.index({ isPublic: 1, likes: -1 });
RecipeSchema.index({ isPublic: 1, views: -1 });
RecipeSchema.index({ userId: 1, isPublic: 1 });
RecipeSchema.index({ tags: 1 });