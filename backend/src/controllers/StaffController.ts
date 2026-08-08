import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export class StaffController {
  // Get all staffs and manager for the current division/role
  static async getStaffs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.managerId || req.user!.id;
      const userRole = req.user!.role;
      
      const staffs = await prisma.user.findMany({
        where: {
          OR: [
            { id: managerId },
            { managerId: managerId },
            { role: userRole }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          managerId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      res.status(200).json({ success: true, data: staffs });
    } catch (error) {
      next(error);
    }
  }

  // Create a new staff under the current manager
  static async createStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const managerId = req.user!.id;
      const managerRole = req.user!.role;

      // Ensure the user is not a staff themselves
      const user = await prisma.user.findUnique({ where: { id: managerId } });
      if (user?.managerId) {
        return res.status(403).json({ success: false, message: 'A staff member cannot create another staff.' });
      }

      // Allow only specific roles to create staff
      const allowedRoles = ['ENGINEERING', 'PROCUREMENT', 'FINANCE', 'PROYEK_ADMIN'];
      if (!allowedRoles.includes(managerRole)) {
        return res.status(403).json({ success: false, message: 'You are not authorized to create staff members.' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const staff = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: managerRole as Role,
          managerId
        }
      });

      res.status(201).json({ success: true, data: { id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
    } catch (error: any) {
      if (error.code === 'P2002') {
         res.status(400).json({ success: false, message: 'Email already exists.' });
         return;
      }
      next(error);
    }
  }

  // Edit a staff
  static async updateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;
      const managerId = req.user!.id;

      // Verify ownership
      const staff = await prisma.user.findFirst({
        where: { id, managerId }
      });

      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff not found or access denied.' });
      }

      const updateData: any = { name, email };
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updatedStaff = await prisma.user.update({
        where: { id },
        data: updateData
      });

      res.status(200).json({ success: true, data: { id: updatedStaff.id, name: updatedStaff.name, email: updatedStaff.email } });
    } catch (error: any) {
      if (error.code === 'P2002') {
         res.status(400).json({ success: false, message: 'Email already exists.' });
         return;
      }
      next(error);
    }
  }

  // Delete a staff
  static async deleteStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const managerId = req.user!.id;

      // Verify ownership
      const staff = await prisma.user.findFirst({
        where: { id, managerId }
      });

      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff not found or access denied.' });
      }

      await prisma.user.delete({ where: { id } });

      res.status(200).json({ success: true, message: 'Staff deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
