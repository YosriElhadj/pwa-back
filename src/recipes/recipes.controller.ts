import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipeDto } from './dto/query-recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // ============================================
  // ROUTES PUBLIQUES EN PREMIER (TRÈS IMPORTANT)
  // ============================================
  
  @Get('public/feed')
  async getPublicFeed(@Query() queryDto: QueryRecipeDto) {
    console.log('🔵 GET PUBLIC FEED - Query:', queryDto);
    return this.recipesService.findPublicFeed(queryDto);
  }

  @Get('public/:id')
  async getPublicRecipe(@Param('id') id: string) {
    console.log('🔵 GET PUBLIC RECIPE - ID:', id);
    return this.recipesService.findPublicById(id);
  }

  // ============================================
  // ROUTES PROTÉGÉES SPÉCIFIQUES
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyRecipes(@Request() req) {
    console.log('🔵 GET MY RECIPES - User:', req.user);
    return this.recipesService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  findFavorites(@Request() req) {
    return this.recipesService.findFavorites(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('category/:category')
  findByCategory(@Param('category') category: string, @Request() req) {
    return this.recipesService.findByCategory(category, req.user.userId);
  }

  // ============================================
  // ROUTES PROTÉGÉES AVEC POST/PATCH/DELETE
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto, @Request() req) {
    console.log('🔵 CREATE RECIPE - User:', req.user);
    console.log('🔵 CREATE RECIPE - isPublic:', createRecipeDto.isPublic);
    return this.recipesService.create(
      createRecipeDto, 
      req.user.userId,
      req.user.name || 'Anonyme'
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req) {
    console.log('🔵 TOGGLE LIKE - Recipe ID:', id, 'User:', req.user.userId);
    return this.recipesService.toggleLike(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req,
  ) {
    console.log('🔵 UPDATE RECIPE - ID:', id);
    return this.recipesService.update(id, updateRecipeDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    console.log('🔵 DELETE RECIPE - ID:', id);
    return this.recipesService.remove(id, req.user.userId);
  }

  // ============================================
  // ROUTES AVEC PARAMÈTRES DYNAMIQUES EN DERNIER
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recipesService.findOne(id, req.user.userId);
  }
}