import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipeDto, RecipeSortBy } from './dto/query-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, userId: string, userName: string, userAvatar?: string): Promise<Recipe> {
    const createdRecipe = new this.recipeModel({
      ...createRecipeDto,
      userId,
      authorName: userName,
      authorAvatar: userAvatar,
      isPublic: createRecipeDto.isPublic || false,
      tags: createRecipeDto.tags || [],
    });
    return createdRecipe.save();
  }

  // Mes recettes privées
  async findAll(userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

 // NOUVELLE MÉTHODE : Feed public
async findPublicFeed(queryDto: QueryRecipeDto): Promise<{
  recipes: Recipe[];
  total: number;
  page: number;
  totalPages: number;
}> {
  // AJOUTEZ DES VALEURS PAR DÉFAUT ICI
  const { 
    sortBy, 
    category, 
    difficulty, 
    search, 
    tag, 
    page = 1,      // <-- Valeur par défaut
    limit = 20     // <-- Valeur par défaut
  } = queryDto;

  // Construction du filtre
  const filter: any = { isPublic: true };

  if (category && category !== 'Toutes') {
    filter.category = category;
  }

  if (difficulty && difficulty !== 'Toutes') {
    filter.difficulty = difficulty;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'ingredients.name': { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Tri
  let sort: any = {};
  switch (sortBy) {
    case RecipeSortBy.POPULAR:
      sort = { likes: -1, views: -1 };
      break;
    case RecipeSortBy.TRENDING:
      // Algorithme simple de trending: likes récents + vues
      // Dans une vraie app, on utiliserait un score calculé
      sort = { likes: -1, createdAt: -1 };
      break;
    case RecipeSortBy.NEWEST:
    default:
      sort = { createdAt: -1 };
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [recipes, total] = await Promise.all([
    this.recipeModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.recipeModel.countDocuments(filter),
  ]);

  return {
    recipes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

  // NOUVELLE MÉTHODE : Like/Unlike
  async toggleLike(recipeId: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    const userIdObj = userId as any;
    const hasLiked = recipe.likedBy.some(id => id.toString() === userId);

    if (hasLiked) {
      // Unlike
      recipe.likedBy = recipe.likedBy.filter(id => id.toString() !== userId);
      recipe.likes = Math.max(0, recipe.likes - 1);
    } else {
      // Like
      recipe.likedBy.push(userIdObj);
      recipe.likes += 1;
    }

    return recipe.save();
  }

  // NOUVELLE MÉTHODE : Incrémenter les vues
  async incrementViews(recipeId: string): Promise<void> {
    await this.recipeModel.findByIdAndUpdate(
      recipeId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  // NOUVELLE MÉTHODE : Recette publique par ID
  async findPublicById(recipeId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findOne({
      _id: recipeId,
      isPublic: true,
    }).exec();

    if (!recipe) {
      throw new NotFoundException('Recette publique introuvable');
    }

    // Incrémenter les vues
    await this.incrementViews(recipeId);

    return recipe;
  }

  // Méthodes existantes...
  async findOne(id: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(id).exec();
    
    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

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