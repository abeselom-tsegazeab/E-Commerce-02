import { body, param, query } from "express-validator";
import mongoose from "mongoose";

// Common validations
export const productIdValidation = [
  param("id")
    .exists()
    .withMessage("Product ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid product ID");
      }
      return true;
    }),
];

export const imageIdValidation = [
  param("imageId")
    .exists()
    .withMessage("Image ID is required")
    .isString()
    .withMessage("Image ID must be a string")
    .notEmpty()
    .withMessage("Image ID cannot be empty"),
];

// Product validations
export const createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Product name must be between 3 and 200 characters"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Product slug is required")
    .isSlug()
    .withMessage("Invalid slug format. Use letters, numbers, and hyphens only")
    .toLowerCase(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("comparePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number"),

  body("category")
    .exists()
    .withMessage("Category is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid category ID");
      }
      return true;
    }),

  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer")
    .notEmpty()
    .withMessage("Product quantity is required"),

  body("subcategory")
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid subcategory ID");
      }
      return true;
    }),

  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("sku")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("SKU must be between 3 and 50 characters"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean value"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("weight.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),

  body("weight.unit")
    .optional()
    .isIn(["g", "kg", "lb", "oz"])
    .withMessage("Invalid weight unit"),

  body("dimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Length must be a positive number"),

  body("dimensions.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Width must be a positive number"),

  body("dimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Height must be a positive number"),

  body("dimensions.unit")
    .optional()
    .isIn(["mm", "cm", "in"])
    .withMessage("Invalid dimension unit"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags) => {
      if (tags && !tags.every((tag) => typeof tag === "string")) {
        throw new Error("All tags must be strings");
      }
      return true;
    }),

  body("metaTitle")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Meta title cannot exceed 100 characters"),

  body("metaDescription")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Meta description cannot exceed 255 characters"),

  body("hasVariants")
    .optional()
    .isBoolean()
    .withMessage("hasVariants must be a boolean value"),

  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array")
    .custom((variants) => {
      if (!variants) return true;

      return variants.every((variant) => {
        if (!variant.options || !Array.isArray(variant.options)) {
          throw new Error("Each variant must have an options array");
        }

        if (variant.price && typeof variant.price !== "number") {
          throw new Error("Variant price must be a number");
        }

        if (variant.comparePrice && typeof variant.comparePrice !== "number") {
          throw new Error("Variant compare price must be a number");
        }

        if (variant.quantity && typeof variant.quantity !== "number") {
          throw new Error("Variant quantity must be a number");
        }

        return true;
      });
    }),
];

// Image validations
export const addImagesValidation = [
  ...productIdValidation,

  // Check if files were uploaded
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Check file types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalidFiles = req.files.filter(
      (file) => !allowedTypes.includes(file.mimetype)
    );

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, and WebP images are allowed",
      });
    }

    // Check file sizes (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = req.files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Image size cannot exceed 5MB",
      });
    }

    next();
  },
];

export const updateImageValidation = [
  ...productIdValidation,
  ...imageIdValidation,

  body("altText")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Alt text cannot exceed 255 characters"),

  body("isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean value"),

  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
];

export const deleteImageValidation = [
  ...productIdValidation,
  ...imageIdValidation,
];

export const setPrimaryImageValidation = [
  ...productIdValidation,
  ...imageIdValidation,
];

export const reorderImagesValidation = [
  ...productIdValidation,

  body("order")
    .exists()
    .withMessage("Order array is required")
    .isArray()
    .withMessage("Order must be an array")
    .notEmpty()
    .withMessage("Order array cannot be empty")
    .custom((order) => {
      if (!order.every((id) => typeof id === "string" && id.length > 0)) {
        throw new Error("Order array must contain non-empty strings");
      }
      return true;
    }),
];

// Product query validations
export const getProductsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sort")
    .optional()
    .isString()
    .withMessage("Sort must be a string")
    .trim()
    .isIn([
      "newest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
      "featured",
    ])
    .withMessage("Invalid sort option"),

  query("category")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid category ID");
      }
      return true;
    }),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),

  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean value")
    .toBoolean(),

  query("featured")
    .optional()
    .isBoolean()
    .withMessage("featured must be a boolean value")
    .toBoolean(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query cannot exceed 100 characters"),
];

export const getProductValidation = [...productIdValidation];

export const updateProductValidation = [
  ...productIdValidation,
  ...createProductValidation,
];

export const deleteProductValidation = [...productIdValidation];

// Bulk update validations
export const validateBulkUpdate = (data) => {
  const { productIds, updates } = data;
  const errors = [];

  // Validate productIds
  if (!Array.isArray(productIds) || productIds.length === 0) {
    errors.push("productIds must be a non-empty array");
  } else {
    const invalidIds = productIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      errors.push(`Invalid product IDs: ${invalidIds.join(", ")}`);
    }
  }

  // Validate updates object
  if (
    !updates ||
    typeof updates !== "object" ||
    Object.keys(updates).length === 0
  ) {
    errors.push("Updates object is required and must not be empty");
  } else {
    // Validate specific update fields
    if ("isActive" in updates && typeof updates.isActive !== "boolean") {
      errors.push("isActive must be a boolean");
    }
    if ("isFeatured" in updates && typeof updates.isFeatured !== "boolean") {
      errors.push("isFeatured must be a boolean");
    }
    // Add more field validations as needed
  }

  return {
    error:
      errors.length > 0 ? { details: [{ message: errors.join("; ") }] } : null,
  };
};

/**
 * Validates bulk operation parameters
 * @param {Object} data - The data to validate
 * @returns {Object} - Object containing error details if validation fails
 */
/**
 * Validates product data for create/update operations
 */
export const validateProductData = [
  // Basic info
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be between 3 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),

  // Pricing
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .toFloat(),

  body("comparePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare price must be a positive number")
    .toFloat(),

  // Inventory
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer")
    .toInt(),

  body("sku")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU cannot exceed 100 characters"),

  body("barcode")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Barcode cannot exceed 100 characters"),

  // Organization
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),

  body("collections")
    .optional()
    .isArray()
    .withMessage("Collections must be an array of collection IDs")
    .custom((collections) => {
      if (!Array.isArray(collections)) return true;
      return collections.every((id) => mongoose.Types.ObjectId.isValid(id));
    })
    .withMessage("Invalid collection ID format"),

  // Status
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean")
    .toBoolean(),

  // Shipping
  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number")
    .toFloat(),

  body("dimensions")
    .optional()
    .isObject()
    .withMessage("Dimensions must be an object")
    .custom((dimensions) => {
      if (!dimensions) return true;
      const { length, width, height } = dimensions;
      return [length, width, height].every(
        (dim) => dim === undefined || (typeof dim === "number" && dim >= 0)
      );
    })
    .withMessage("Dimensions must be positive numbers"),

  // SEO
  body("seo").optional().isObject().withMessage("SEO must be an object"),

  body("seo.title")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 70 })
    .withMessage("SEO title cannot exceed 70 characters"),

  body("seo.description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 160 })
    .withMessage("SEO description cannot exceed 160 characters"),

  body("seo.keywords")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("SEO keywords cannot exceed 255 characters"),
];

export const validateBulkOperation = (data) => {
  const { productIds, operation, value } = data;
  const errors = [];

  // Validate productIds
  if (!Array.isArray(productIds) || productIds.length === 0) {
    errors.push("productIds must be a non-empty array");
  } else {
    const invalidIds = productIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      errors.push(`Invalid product IDs: ${invalidIds.join(", ")}`);
    }
  }

  // Validate operation
  const validOperations = [
    "update",
    "delete",
    "publish",
    "unpublish",
    "feature",
    "unfeature",
  ];
  if (!validOperations.includes(operation)) {
    errors.push(`Operation must be one of: ${validOperations.join(", ")}`);
  }

  // Validate value based on operation
  if (operation === "update") {
    if (!value || typeof value !== "object") {
      errors.push("Value must be an object for update operation");
    } else {
      // Add specific field validations for update operation
      if (
        "price" in value &&
        (isNaN(parseFloat(value.price)) || parseFloat(value.price) < 0)
      ) {
        errors.push("Price must be a non-negative number");
      }
      if (
        "stock" in value &&
        (!Number.isInteger(value.stock) || value.stock < 0)
      ) {
        errors.push("Stock must be a non-negative integer");
      }
      // Add more field validations as needed
    }
  }

  return {
    error:
      errors.length > 0 ? { details: [{ message: errors.join("; ") }] } : null,
  };
};

/**
 * Validates product search parameters
 */
/**
 * Validates product variant data
 */
export const validateVariantData = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Variant name is required")
    .isLength({ max: 100 })
    .withMessage("Variant name cannot exceed 100 characters"),

  body("sku")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("SKU cannot exceed 50 characters"),

  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barcode cannot exceed 50 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .toFloat(),

  body("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare at price must be a positive number")
    .toFloat(),

  body("cost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost must be a positive number")
    .toFloat(),

  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer")
    .toInt(),

  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number")
    .toFloat(),

  body("dimensions")
    .optional()
    .isObject()
    .withMessage("Dimensions must be an object")
    .custom((dimensions) => {
      if (!dimensions) return true;
      const { length, width, height } = dimensions;
      return [length, width, height].every(
        (dim) => dim === undefined || (typeof dim === "number" && dim >= 0)
      );
    })
    .withMessage("Dimensions must be positive numbers"),

  body("options")
    .optional()
    .isArray()
    .withMessage("Options must be an array")
    .custom((options) => {
      if (!Array.isArray(options)) return false;
      return options.every(
        (option) =>
          option &&
          typeof option.name === "string" &&
          typeof option.value === "string" &&
          option.name.trim().length > 0 &&
          option.value.trim().length > 0
      );
    })
    .withMessage("Each option must have a name and value"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array")
    .custom((images) => {
      if (!Array.isArray(images)) return false;
      return images.every(
        (image) =>
          image &&
          (typeof image.url === "string" || image instanceof File) &&
          (!image.altText || typeof image.altText === "string")
      );
    })
    .withMessage("Invalid image format"),
];

export const validateProductSearch = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters"),

  query("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s-]+$/, "i")
    .withMessage(
      "Category name can only contain letters, numbers, spaces, and hyphens"
    ),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number")
    .toFloat(),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .toFloat()
    .custom((maxPrice, { req }) => {
      if (req.query.minPrice && maxPrice < req.query.minPrice) {
        throw new Error(
          "Maximum price must be greater than or equal to minimum price"
        );
      }
      return true;
    }),

  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean")
    .toBoolean(),

  query("sortBy")
    .optional()
    .isIn(["name", "price", "createdAt", "updatedAt", "popularity"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage('Sort order must be either "asc" or "desc"')
    .default("asc"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt()
    .default(1),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt()
    .default(10),

  query("tags")
    .optional()
    .custom((tags) => {
      if (typeof tags === "string") return true;
      if (Array.isArray(tags)) {
        return tags.every((tag) => typeof tag === "string");
      }
      return false;
    })
    .withMessage("Tags must be a string or an array of strings"),

  query("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5")
    .toFloat(),
];

// Add this to your product.validations.js file
export const getProductStatsValidation = [
  query("timeframe")
    .optional()
    .isIn(["day", "week", "month", "year", "all"])
    .withMessage("Timeframe must be one of: day, week, month, year, all"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (
        req.query.startDate &&
        new Date(value) < new Date(req.query.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sort")
    .optional()
    .isIn(["views", "sales", "rating", "date"])
    .withMessage("Sort must be one of: views, sales, rating, date"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage('Order must be either "asc" or "desc"')
    .default("desc"),
];

// Add this to your product.validations.js file
export const getSalesAnalyticsValidation = [
  query("startDate")
    .isISO8601()
    .withMessage("Start date is required and must be a valid ISO 8601 date"),

  query("endDate")
    .isISO8601()
    .withMessage("End date is required and must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  query("groupBy")
    .optional()
    .isIn(["day", "week", "month", "year", "product", "category"])
    .withMessage(
      "Group by must be one of: day, week, month, year, product, category"
    )
    .default("day"),

  query("categoryId").optional().isMongoId().withMessage("Invalid category ID"),

  query("productId").optional().isMongoId().withMessage("Invalid product ID"),

  query("minAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum amount must be a positive number")
    .toFloat(),

  query("maxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum amount must be a positive number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minAmount && value < req.query.minAmount) {
        throw new Error(
          "Maximum amount must be greater than or equal to minimum amount"
        );
      }
      return true;
    }),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Limit must be between 1 and 1000")
    .toInt()
    .default(100),
];

// Add this to your product.validations.js file
export const getTopProductsValidation = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt()
    .default(10),

  query("timeframe")
    .optional()
    .isIn(["day", "week", "month", "year", "all"])
    .withMessage("Timeframe must be one of: day, week, month, year, all")
    .default("month"),

  query("category").optional().isMongoId().withMessage("Invalid category ID"),

  query("sortBy")
    .optional()
    .isIn(["sales", "revenue", "rating", "views"])
    .withMessage("Sort by must be one of: sales, revenue, rating, views")
    .default("sales"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage('Order must be either "asc" or "desc"')
    .default("desc"),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number")
    .toFloat(),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minPrice && value < req.query.minPrice) {
        throw new Error(
          "Maximum price must be greater than or equal to minimum price"
        );
      }
      return true;
    }),

  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean")
    .toBoolean(),
];

// Add this to your product.validations.js file
export const recordRatingValidation = [
  body("rating")
    .isFloat({ min: 0.5, max: 5 })
    .withMessage("Rating must be between 0.5 and 5")
    .toFloat(),

  body("review")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Review must be less than 1000 characters"),

  body("userId")
    .exists()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  param("productId")
    .exists()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
];

// Add this to your product.validations.js file
// Batch product validation
export const validateBatchProducts = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('At least one product ID is required')
    .custom(ids => {
      if (!Array.isArray(ids)) return false;
      return ids.every(id => mongoose.Types.ObjectId.isValid(id));
    })
    .withMessage('All IDs must be valid MongoDB ObjectIds')
    .customSanitizer(ids => 
      Array.from(new Set(ids)) // Remove duplicates
    ),
];

export const recordSaleValidation = [
  body("productId")
    .exists()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("quantity")
    .exists()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1")
    .toInt(),

  body("price")
    .exists()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .toFloat(),

  body("orderId")
    .optional()
    .isString()
    .withMessage("Order ID must be a string"),

  body("customerId").optional().isMongoId().withMessage("Invalid customer ID"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage(
      "Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)"
    )
    .toDate(),
];

// Add this to your product.validations.js file
export const recordShareValidation = [
  param("productId")
    .exists()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("platform")
    .exists()
    .withMessage("Platform is required")
    .isString()
    .isIn([
      "facebook",
      "twitter",
      "instagram",
      "whatsapp",
      "email",
      "link",
      "other",
    ])
    .withMessage("Invalid platform"),

  body("userId").optional().isMongoId().withMessage("Invalid user ID"),

  body("sharedWith")
    .optional()
    .isString()
    .withMessage("Shared with must be a string")
    .isLength({ max: 255 })
    .withMessage("Shared with must be less than 255 characters"),

  body("sharedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format. Use ISO 8601 format")
    .toDate(),
];

export const recordTimeSpentValidation = [
  param("productId")
    .exists()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("duration")
    .exists()
    .withMessage("Duration is required")
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive number in seconds")
    .toInt(),

  body("userId").optional().isMongoId().withMessage("Invalid user ID"),

  body("pageUrl")
    .optional()
    .isString()
    .withMessage("Page URL must be a string")
    .isURL()
    .withMessage("Invalid URL format"),

  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Invalid timestamp format. Use ISO 8601 format")
    .toDate(),
];

export const updateInventoryValidation = [
  param("productId")
    .exists()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("inventory")
    .exists()
    .withMessage("Inventory data is required")
    .isObject()
    .withMessage("Inventory must be an object"),

  body("inventory.quantity")
    .exists()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer")
    .toInt(),

  body("inventory.inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean"),

  body("inventory.lowStockThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold must be a non-negative integer")
    .toInt(),

  body("inventory.updatedBy")
    .optional()
    .isMongoId()
    .withMessage("Invalid user ID"),
];
