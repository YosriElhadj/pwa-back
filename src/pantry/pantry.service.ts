import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pantry, PantryDocument } from './schemas/pantry.schema';
import { CreatePantryDto } from './dto/create-pantry.dto';

@Injectable()
export class PantryService {
  constructor(
    @InjectModel(Pantry.name) private pantryModel: Model<PantryDocument>,
  ) {}

  async create(userId: string, createPantryDto: CreatePantryDto): Promise<PantryDocument> {
    const pantryItem = new this.pantryModel({
      ...createPantryDto,
      userId: new Types.ObjectId(userId),
    });
    return pantryItem.save();
  }

  // ✅ FIXED: Cast the return type properly
  async addMultiple(userId: string, ingredients: CreatePantryDto[]): Promise<PantryDocument[]> {
    const pantryItems = ingredients.map(ingredient => ({
      ...ingredient,
      userId: new Types.ObjectId(userId),
    }));
    
    const result = await this.pantryModel.insertMany(pantryItems);
    return result as unknown as PantryDocument[];
  }

  async findAllByUser(userId: string): Promise<PantryDocument[]> {
    const items = await this.pantryModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ addedAt: -1 })
      .exec();

    // Check and update expired items
    const now = new Date();
    const updates = items.map(async (item) => {
      if (item.expiryDate && item.expiryDate < now && !item.isExpired) {
        item.isExpired = true;
        return item.save();
      }
      return item;
    });

    return Promise.all(updates);
  }

  async findById(id: string, userId: string): Promise<PantryDocument> {
    const item = await this.pantryModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    
    if (!item) {
      throw new NotFoundException('Ingrédient non trouvé');
    }
    
    return item;
  }

  async update(id: string, userId: string, updateData: Partial<Pantry>): Promise<PantryDocument> {
    const item = await this.findById(id, userId);
    Object.assign(item, updateData);
    return item.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.pantryModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Ingrédient non trouvé');
    }
  }

  async deleteAll(userId: string): Promise<void> {
    await this.pantryModel.deleteMany({ userId: new Types.ObjectId(userId) });
  }

  async getExpiringItems(userId: string, days: number = 3): Promise<PantryDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.pantryModel
      .find({
        userId: new Types.ObjectId(userId),
        expiryDate: { $lte: futureDate, $gte: new Date() },
        isExpired: false,
      })
      .sort({ expiryDate: 1 })
      .exec();
  }
}