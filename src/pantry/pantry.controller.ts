import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { PantryService } from './pantry.service';
import { CreatePantryDto } from './dto/create-pantry.dto';
import { AddIngredientsDto } from './dto/add-ingredients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('pantry')
@UseGuards(JwtAuthGuard)
export class PantryController {
  constructor(private pantryService: PantryService) {}

  @Post()
  async create(@Request() req, @Body() createPantryDto: CreatePantryDto) {
    return this.pantryService.create(req.user.userId, createPantryDto);
  }

  @Post('batch')
  async addMultiple(@Request() req, @Body() addIngredientsDto: AddIngredientsDto) {
    return this.pantryService.addMultiple(req.user.userId, addIngredientsDto.ingredients);
  }

  @Get()
  async findAll(@Request() req) {
    return this.pantryService.findAllByUser(req.user.userId);
  }

  @Get('expiring')
  async getExpiring(@Request() req) {
    return this.pantryService.getExpiringItems(req.user.userId, 3);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.pantryService.findById(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePantryDto>,
  ) {
    return this.pantryService.update(id, req.user.userId, updateData);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.pantryService.delete(id, req.user.userId);
    return { message: 'Ingrédient supprimé avec succès' };
  }

  @Delete()
  async deleteAll(@Request() req) {
    await this.pantryService.deleteAll(req.user.userId);
    return { message: 'Tous les ingrédients ont été supprimés' };
  }
}