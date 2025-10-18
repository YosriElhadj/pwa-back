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
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto, @Request() req) {
    return this.recipesService.create(createRecipeDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('userId') userId?: string) {
    // Support pour le query param userId (pour compatibilité avec le frontend)
    const userIdToUse = userId || req.user.userId;
    return this.recipesService.findAll(userIdToUse);
  }

  @Get('favorites')
  findFavorites(@Request() req) {
    return this.recipesService.findFavorites(req.user.userId);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string, @Request() req) {
    return this.recipesService.findByCategory(category, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recipesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req,
  ) {
    return this.recipesService.update(id, updateRecipeDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recipesService.remove(id, req.user.userId);
  }
}