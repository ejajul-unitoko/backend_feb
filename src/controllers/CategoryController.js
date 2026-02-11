import CategoryService from '../services/CategoryService.js';

class CategoryController {
    async getAllCategories(req, res, next) {
        try {
            const filters = req.query;
            const categories = await CategoryService.getAllCategories(filters);
            res.json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (err) {
            next(err);
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await CategoryService.getCategoryById(id);
            res.json({
                success: true,
                data: category
            });
        } catch (err) {
            if (err.message === 'Category not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async createCategory(req, res, next) {
        try {
            // Admin only usually, middleware handles auth
            const category = await CategoryService.createCategory(req.body);
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (err) {
            if (err.message === 'Category with this slug already exists' || err.message === 'Category name is required') {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const category = await CategoryService.updateCategory(id, req.body);
            res.json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (err) {
            if (err.message === 'Category not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            if (err.message.includes('slug') || err.message.includes('parent')) {
                return res.status(400).json({ success: false, error: err.message });
            }
            next(err);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            await CategoryService.deleteCategory(id);
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (err) {
            if (err.message === 'Category not found') {
                return res.status(404).json({ success: false, error: err.message });
            }
            next(err);
        }
    }
}

export default new CategoryController();
