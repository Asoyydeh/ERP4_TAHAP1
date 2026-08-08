import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, passwordHash, password } = req.body;
      const pwd = passwordHash || password || '';
      const result = await AuthService.login(email, pwd);
      res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
      }

      const { name, email, password, address, role } = req.body;
      const photoUrl = req.file ? `/storage/uploads/users/${userId}/profile/${req.file.filename}` : undefined;

      const updateData: any = { name, email, address };
      if (role && req.user?.role === 'SUPERADMIN') {
        updateData.role = role;
      }
      if (password) {
        const bcrypt = require('bcryptjs');
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      if (photoUrl) {
        updateData.photoUrl = photoUrl;
      }

      const updatedUser = await AuthService.updateProfile(userId, updateData);
      res.status(200).json({
        success: true,
        message: 'Profil berhasil diperbarui',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Re-fetch user to get latest data including address and photoUrl
      const user = await AuthService.getUserById(req.user!.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updatedUser = await AuthService.updateUserByAdmin(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Pengguna berhasil diperbarui',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (req.user?.id === id) {
        return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });
      }
      await AuthService.deleteUserByAdmin(id);
      res.status(200).json({
        success: true,
        message: 'Pengguna berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
}
