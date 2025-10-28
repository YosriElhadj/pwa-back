import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RecipesModule } from './recipes/recipes.module';
import { UploadModule } from './upload/upload.module';
import { PantryModule } from './pantry/pantry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe-manager'),
    AuthModule,
    UsersModule,
    RecipesModule,
    UploadModule,
    PantryModule
  ],
})
export class AppModule {}