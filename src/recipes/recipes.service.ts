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

  // Helper method to calculate nutrition totals
  private calculateNutritionTotals(ingredients: any[]): {
    totalCalories: number;
    totalProtein: number;
    totalFat: number;
    totalCarbs: number;
  } {
    const totals = ingredients.reduce(
      (acc, ing) => {
        // Extract number from quantity string (e.g., "200g" -> 200)
        const quantityMatch = ing.quantity?.match(/(\d+\.?\d*)/);
        const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 100;
        
        // Assume nutrition data is per 100g
        const multiplier = quantity / 100;

        return {
          totalCalories: acc.totalCalories + (ing.calories || 0) * multiplier,
          totalProtein: acc.totalProtein + (ing.protein || 0) * multiplier,
          totalFat: acc.totalFat + (ing.fat || 0) * multiplier,
          totalCarbs: acc.totalCarbs + (ing.carbs || 0) * multiplier,
        };
      },
      { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
    );

    return totals;
  }

  async create(createRecipeDto: CreateRecipeDto, userId: string, userName: string, userAvatar?: string): Promise<Recipe> {
    // Calculate nutrition totals
    const nutritionTotals = this.calculateNutritionTotals(createRecipeDto.ingredients);

    const createdRecipe = new this.recipeModel({
      ...createRecipeDto,
      userId,
      authorName: userName,
      authorAvatar: userAvatar,
      isPublic: createRecipeDto.isPublic || false,
      tags: createRecipeDto.tags || [],
      ...nutritionTotals, // Add calculated totals
    });
    
    console.log('🍳 Creating recipe with nutrition:', {
      title: createRecipeDto.title,
      ...nutritionTotals,
    });

    return createdRecipe.save();
  }

  // Mes recettes privées
  async findAll(userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  // FIXED: Feed public avec valeurs par défaut
  async findPublicFeed(queryDto: QueryRecipeDto): Promise<{
    recipes: Recipe[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Valeurs par défaut explicites
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const sortBy = queryDto.sortBy || RecipeSortBy.NEWEST;
    const { category, difficulty, search, tag } = queryDto;

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
        sort = { likes: -1, createdAt: -1 };
        break;
      case RecipeSortBy.NEWEST:
      default:
        sort = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    console.log('🔍 PUBLIC FEED QUERY:', { filter, sort, page, limit, skip });

    const [recipes, total] = await Promise.all([
      this.recipeModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.recipeModel.countDocuments(filter),
    ]);

    console.log('✅ PUBLIC FEED RESULTS:', { recipesFound: recipes.length, total });

    return {
      recipes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // NOUVEAU: Trouver une recette publique par ID
  async findPublicById(id: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findOne({ _id: id, isPublic: true }).exec();
    
    if (!recipe) {
      throw new NotFoundException('Recette publique introuvable');
    }

    // Incrémenter les vues
    await this.recipeModel.updateOne({ _id: id }, { $inc: { views: 1 } });

    return recipe;
  }

  // Trouver par ID (mes recettes)
  async findOne(id: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findOne({ _id: id, userId }).exec();
    
    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    return recipe;
  }

  // Favoris
  async findFavorites(userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId, isFavorite: true }).sort({ createdAt: -1 }).exec();
  }

  // Par catégorie
  async findByCategory(category: string, userId: string): Promise<Recipe[]> {
    return this.recipeModel.find({ userId, category }).sort({ createdAt: -1 }).exec();
  }

  // Mettre à jour
  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findOne({ _id: id, userId }).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    // Recalculate nutrition if ingredients changed
    let nutritionTotals = {};
    if (updateRecipeDto.ingredients) {
      nutritionTotals = this.calculateNutritionTotals(updateRecipeDto.ingredients);
      console.log('🔄 Updating recipe nutrition:', {
        title: recipe.title,
        ...nutritionTotals,
      });
    }

    Object.assign(recipe, updateRecipeDto, nutritionTotals);
    recipe.updatedAt = new Date();

    return recipe.save();
  }

  // Supprimer
  async remove(id: string, userId: string): Promise<void> {
    const result = await this.recipeModel.deleteOne({ _id: id, userId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Recette introuvable');
    }
  }

  // NOUVEAU: Toggle like
  async toggleLike(recipeId: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(recipeId).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    // Vérifier si l'utilisateur a déjà liké
    const userIdObj = userId as any;
    const hasLiked = recipe.likedBy.some(id => id.toString() === userIdObj.toString());

    if (hasLiked) {
      // Unlike
      recipe.likedBy = recipe.likedBy.filter(id => id.toString() !== userIdObj.toString());
      recipe.likes = Math.max(0, recipe.likes - 1);
    } else {
      // Like
      recipe.likedBy.push(userIdObj);
      recipe.likes += 1;
    }

    return recipe.save();
  }

  // COMMENTS: Add comment
  async addComment(
    recipeId: string,
    userId: string,
    userName: string,
    commentText: string,
    userAvatar?: string,
  ): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(recipeId).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    if (!recipe.isPublic) {
      throw new ForbiddenException('Cette recette n\'est pas publique');
    }

    const newComment = {
      userId,
      userName,
      userAvatar,
      text: commentText,
      createdAt: new Date(),
    };

    recipe.comments.push(newComment as any);
    
    console.log('💬 Comment added:', {
      recipeId,
      userName,
      commentsCount: recipe.comments.length,
    });

    return recipe.save();
  }

  // COMMENTS: Delete comment
  async deleteComment(
    recipeId: string,
    commentId: string,
    userId: string,
  ): Promise<Recipe> {
    const recipe = await this.recipeModel.findById(recipeId).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    const commentIndex = recipe.comments.findIndex(
      (comment: any) => comment._id.toString() === commentId,
    );

    if (commentIndex === -1) {
      throw new NotFoundException('Commentaire introuvable');
    }

    // Vérifier que l'utilisateur est propriétaire du commentaire ou de la recette
    const comment = recipe.comments[commentIndex] as any;
    if (
      comment.userId.toString() !== userId &&
      recipe.userId.toString() !== userId
    ) {
      throw new ForbiddenException(
        'Vous n\'avez pas la permission de supprimer ce commentaire',
      );
    }

    recipe.comments.splice(commentIndex, 1);
    
    console.log('🗑️ Comment deleted:', {
      recipeId,
      commentId,
      remainingComments: recipe.comments.length,
    });

    return recipe.save();
  }

  // COMMENTS: Get comments
  async getComments(recipeId: string): Promise<any[]> {
    const recipe = await this.recipeModel.findById(recipeId).exec();

    if (!recipe) {
      throw new NotFoundException('Recette introuvable');
    }

    return recipe.comments.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}