import Category from '../models/category.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import slugify from 'slugify';

// Helper function to build category hierarchy
const buildCategoryTree = (categories, parentId = null) => {
  const categoryList = [];
  let filteredCategories = categories;
  
  if (parentId === null) {
    filteredCategories = categories.filter(cat => !cat.parent);
  } else {
    filteredCategories = categories.filter(cat => 
      cat.parent && cat.parent.toString() === parentId.toString()
    );
  }

  for (const category of filteredCategories) {
    const children = buildCategoryTree(categories, category._id);
    categoryList.push({
      ...category.toObject(),
      children: children.length ? children : undefined
    });
  }

  return categoryList.sort((a, b) => a.order - b.order);
};

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, isActive, order, metaTitle, metaDescription, metaKeywords } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [
        { name },
        { slug: slugify(name, { lower: true }) }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Handle image upload
    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file, 'categories');
      imageUrl = result.secure_url;
    }

    // Build ancestors array
    let ancestors = [];
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (parentCategory) {
        ancestors = [...(parentCategory.ancestors || []), {
          _id: parentCategory._id,
          name: parentCategory.name,
          slug: parentCategory.slug
        }];
      }
    }

    const category = new Category({
      name,
      slug: slugify(name, { lower: true }),
      description,
      parent: parent || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      image: imageUrl,
      ancestors,
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description?.substring(0, 160) || `${name} category`,
      metaKeywords: metaKeywords || name.toLowerCase().split(' ')
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const { tree, status, search, page = 1, limit = 100 } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.isActive = status === 'active';
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For tree view
    if (tree) {
      const categories = await Category.find(query)
        .sort({ order: 1, name: 1 })
        .lean();
      
      const categoryTree = buildCategoryTree(categories);
      return res.json({ 
        success: true, 
        data: categoryTree 
      });
    }

    // For paginated list
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { order: 1, name: 1 },
      populate: { path: 'parent', select: 'name slug' }
    };

    const result = await Category.paginate(query, options);
    
    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        pages: result.totalPages,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single category
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug isActive order');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle image upload if new image is provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file, 'categories');
      updateData.image = result.secure_url;
    }
    
    // If name is being updated, update slug as well
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }
    
    // If parent is being updated, update ancestors
    if (updateData.parent) {
      const parentCategory = await Category.findById(updateData.parent);
      if (parentCategory) {
        updateData.ancestors = [
          ...(parentCategory.ancestors || []),
          {
            _id: parentCategory._id,
            name: parentCategory.name,
            slug: parentCategory.slug
          }
        ];
      }
      
      // Update all descendants' ancestors
      await updateDescendantsAncestors(id, updateData.ancestors);
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to update descendants' ancestors
const updateDescendantsAncestors = async (categoryId, parentAncestors = []) => {
  const category = await Category.findById(categoryId);
  if (!category) return;
  
  const newAncestors = [
    ...(parentAncestors || []),
    {
      _id: category._id,
      name: category.name,
      slug: category.slug
    }
  ];
  
  // Update current category's ancestors
  category.ancestors = parentAncestors || [];
  await category.save();
  
  // Update all direct children
  const children = await Category.find({ parent: categoryId });
  for (const child of children) {
    await updateDescendantsAncestors(child._id, newAncestors);
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has children
    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please remove subcategories first.'
      });
    }
    
    // Check if category is in use by products
    // You'll need to implement this based on your product model
    // const productCount = await Product.countDocuments({ category: id });
    // if (productCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot delete category with associated products.'
    //   });
    // }
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reorder categories
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }
    
    const bulkOps = categories.map((cat, index) => ({
      updateOne: {
        filter: { _id: cat._id },
        update: { $set: { order: index } }
      }
    }));
    
    await Category.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
