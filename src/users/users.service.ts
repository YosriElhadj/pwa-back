import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Create new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hash password if provided (for local users)
    if (createUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }

    // Set default provider if not specified
    if (!createUserDto.provider) {
      createUserDto.provider = createUserDto.googleId ? 'google' : 'local';
    }

    const user = new this.userModel(createUserDto);
    return user.save();
  }

  /**
   * Update user
   */
  async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // If updating password, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    Object.assign(user, updateData);
    return user.save();
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  }

  /**
   * Get all users (admin only)
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatar?: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Check if Google ID is already used
    const existingGoogleUser = await this.findByGoogleId(googleId);
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      throw new ConflictException('Ce compte Google est déjà lié à un autre utilisateur');
    }

    user.googleId = googleId;
    user.provider = 'google';
    if (avatar) user.avatar = avatar;

    return user.save();
  }

  /**
   * Verify user password
   */
  async verifyPassword(user: UserDocument, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }
}