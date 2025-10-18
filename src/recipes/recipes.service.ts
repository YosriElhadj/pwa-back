import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, userId: string): Promise<Recipe> {
    const createdRecipe = new this.recipeModel({
      ...createRecipeDto,
      userId,
    });
    return createdRecipe.save();
  }

  async findAll(userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId }).exec();
  }

  async findOne(id: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(id).exec();
    
    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    // Vérifier que la recette appartient à l'utilisateur
    if (recipe.userId.toString() !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette recette');
    }

    return recipe;
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(id).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    // Vérifier que la recette appartient à l'utilisateur
    if (recipe.userId.toString() !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette recette');
    }

    Object.assign(recipe, updateRecipeDto);
    recipe.updatedAt = new Date();
    return recipe.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const recipe = await this.recipeModel.findById(id).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    // Vérifier que la recette appartient à l'utilisateur
    if (recipe.userId.toString() !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette recette');
    }

    await this.recipeModel.findByIdAndDelete(id).exec();
  }

  async findByCategory(category: string, userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId, category }).exec();
  }

  async findFavorites(userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId, isFavorite: true }).exec();
  }
}