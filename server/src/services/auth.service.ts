import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AuthUser } from '../middleware/auth.middleware';

export class AuthService {
  async login(identifier: string, password: string): Promise<{ token: string; user: any }> {
    // Allows login with either email or username
    let user = await userRepository.findByEmail(identifier);
    if (!user) {
      user = await userRepository.findByUsername(identifier);
    }

    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is inactive. Please contact institute administration.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email/username or password');
    }

    const payload: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      studentId: (user as any).student?.id,
      facultyId: (user as any).faculty?.id,
    };

    const secret = process.env.JWT_SECRET || 'super_secret_tuition_jwt_key_2026_production';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
