import CategoryRepository from '../repositories/CategoryRepository.js';

class CategoryService {
    async getAllCategories(filters = {}) {
        return await CategoryRepository.findAll(filters);
    }

    async getCategoryById(id) {
        const category = await CategoryRepository.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    async createCategory(data) {
        const { name, slug, parent_id } = data;

        if (!name) throw new Error('Category name is required');
        if (!slug) throw new Error('Category slug is required');

        const existing = await CategoryRepository.findBySlug(slug);
        if (existing) {
            throw new Error('Category with this slug already exists');
        }

        if (parent_id) {
            const parent = await CategoryRepository.findById(parent_id);
            if (!parent) {
                throw new Error('Parent category not found');
            }
        }

        return await CategoryRepository.create(data);
    }

    async updateCategory(id, data) {
        const category = await CategoryRepository.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        if (data.slug && data.slug !== category.slug) {
            const existing = await CategoryRepository.findBySlug(data.slug);
            if (existing) {
                throw new Error('Category with this slug already exists');
            }
        }

        if (data.parent_id) {
            if (data.parent_id === id) {
                throw new Error('Category cannot be its own parent');
            }
            const parent = await CategoryRepository.findById(data.parent_id);
            if (!parent) {
                throw new Error('Parent category not found');
            }
        }

        return await CategoryRepository.update(id, data);
    }

    async deleteCategory(id) {
        const category = await CategoryRepository.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // TODO: Check if products exist in category before deleting?
        // For now, allow deletion, but maybe future safe-guard.

        return await CategoryRepository.delete(id);
    }
}

export default new CategoryService();
