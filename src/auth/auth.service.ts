import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Convertir le document Mongoose en objet JS
    const userObject = user.toJSON();
    const { password: _, ...result } = userObject;
    return result;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id.toString(), // Convertir ObjectId en string
      name: user.name 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    
    // Convertir le document Mongoose en objet JS
    const userObject = user.toJSON();
    const { password, ...result } = userObject;
    
    return result;
  }
}