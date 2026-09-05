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

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User account not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password cannot be identical to your current password');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { passwordHash: newPasswordHash });
  }
}

export const authService = new AuthService();
