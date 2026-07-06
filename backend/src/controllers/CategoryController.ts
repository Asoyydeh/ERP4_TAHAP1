import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';

export class CategoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: 'Kategori berhasil dibuat',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Kategori berhasil diperbarui',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Kategori berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
}
