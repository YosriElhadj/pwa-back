import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user with email/password
   */
  async register(registerDto: RegisterDto) {
    try {
      // Create user
      const user = await this.usersService.create({
        email: registerDto.email,
        name: registerDto.name,
        password: registerDto.password,
        provider: 'local',
      });

      // Generate JWT token
      const payload = { 
        sub: user._id.toString(), 
        email: user.email,
        name: user.name,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la création du compte');
    }
  }

  /**
   * Login with email/password
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Generate JWT token
    const payload = { 
      sub: user._id.toString(), 
      email: user.email,
      name: user.name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Check if user signed up with Google and has no password
    if (user.provider === 'google' && !user.password) {
      throw new UnauthorizedException(
        'Ce compte utilise Google Sign-In. Veuillez vous connecter avec Google.'
      );
    }

    // Check if password exists
    if (!user.password) {
      return null;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  /**
   * Google OAuth authentication
   */
  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { email, name, googleId, avatar } = googleAuthDto;

    try {
      // Check if user exists by googleId
      let user = await this.usersService.findByGoogleId(googleId);

      if (!user) {
        // Check if user exists by email (account linking scenario)
        user = await this.usersService.findByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          console.log(`Linking Google account to existing user: ${email}`);
          user = await this.usersService.linkGoogleAccount(
            user._id.toString(),
            googleId,
            avatar,
          );
        } else {
          // Create new user with Google auth
          console.log(`Creating new Google user: ${email}`);
          user = await this.usersService.create({
            email,
            name,
            googleId,
            avatar,
            provider: 'google',
          });
        }
      } else {
        // Update avatar if provided and different
        if (avatar && user.avatar !== avatar) {
          user.avatar = avatar;
          await user.save();
        }
      }

      // Generate JWT token
      const payload = { 
        sub: user._id.toString(), 
        email: user.email,
        name: user.name,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
        },
      };
    } catch (error) {
      console.error('Google auth error:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException(
        'Erreur lors de la connexion avec Google'
      );
    }
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      };
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }

  /**
   * Get user profile from JWT
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      createdAt: user.createdAt,
    };
  }
}