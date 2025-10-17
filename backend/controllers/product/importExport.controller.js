import Product from '../../models/product.model.js';
import ProductStats from '../../models/productStats.model.js';
import Category from '../../models/category.model.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import XLSX from 'xlsx';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Parser as Json2csvParser } from 'json2csv';
import { format } from 'date-fns';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Helper function to get all categories as a map for lookup
const getCategoriesMap = async () => {
  const categories = await Category.find({});
  return new Map(
    categories.map(cat => [
      cat.name.toLowerCase(), 
      { id: cat._id, name: cat.name }
    ])
  );
};

// Helper function to process and validate product data
const processProductData = async (data, categoriesMap) => {
  const processed = { ...data };
  const errors = [];

  // Trim string fields
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'string') {
      processed[key] = processed[key].trim();
    }
  });

  // Process category
  if (processed.category) {
    const category = categoriesMap.get(processed.category.toLowerCase());
    if (category) {
      processed.category = category.id;
    } else {
      errors.push(`Category "${processed.category}" not found`);
    }
  }

  // Process price and comparePrice
  ['price', 'comparePrice'].forEach(field => {
    if (processed[field]) {
      const num = parseFloat(processed[field]);
      if (!isNaN(num)) {
        processed[field] = num;
      } else {
        errors.push(`Invalid ${field} value: ${processed[field]}`);
      }
    }
  });

  // Process quantity
  if (processed.quantity) {
    const qty = parseInt(processed.quantity, 10);
    if (!isNaN(qty)) {
      processed.quantity = qty;
    } else {
      errors.push(`Invalid quantity: ${processed.quantity}`);
    }
  }

  // Process boolean fields
  ['isActive', 'isFeatured', 'hasVariants'].forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = String(processed[field]).toLowerCase() === 'true';
    }
  });

  // Process tags
  if (processed.tags) {
    processed.tags = processed.tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  // Process variants if exists
  if (processed.variants) {
    try {
      processed.variants = JSON.parse(processed.variants);
      if (!Array.isArray(processed.variants)) {
        errors.push('Variants must be a valid JSON array');
      }
    } catch (e) {
      errors.push('Invalid variants JSON format');
    }
  }

  return { processed, errors };
};

// Export products to different formats
export const exportProducts = async (req, res) => {
  try {
    const { 
      format: exportFormat = 'json', // json, csv, xlsx
      fields: fieldsParam,
      category,
      featured,
      inStock,
      minPrice,
      maxPrice,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (featured !== undefined) {
      query.isFeatured = featured === 'true';
    }
    
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
    } else if (inStock === 'false') {
      query.quantity = { $lte: 0 };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Define default fields to export
    const defaultFields = [
      'name',
      'description',
      'price',
      'comparePrice',
      'category',
      'sku',
      'quantity',
      'isActive',
      'isFeatured',
      'tags',
      'metaTitle',
      'metaDescription',
      'weight.value',
      'weight.unit',
      'dimensions.length',
      'dimensions.width',
      'dimensions.height',
      'dimensions.unit'
    ];

    // Parse requested fields or use defaults
    const fields = fieldsParam 
      ? fieldsParam.split(',').map(f => f.trim())
      : defaultFields;

    // Get products with selected fields
    let products = await Product.find(query, fields.join(' '))
      .populate('category', 'name')
      .lean();

    // Transform data for export
    const exportData = products.map(product => {
      const item = { ...product };
      
      // Flatten nested objects
      if (item.category) {
        item.category = item.category.name;
      }
      
      if (item.weight) {
        item.weight = `${item.weight.value} ${item.weight.unit}`;
      }
      
      if (item.dimensions) {
        item.dimensions = `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height} ${item.dimensions.unit}`;
      }
      
      if (item.tags && Array.isArray(item.tags)) {
        item.tags = item.tags.join(',');
      }
      
      return item;
    });

    // Handle different export formats
    let result;
    let contentType;
    let fileName = `products-${format(new Date(), 'yyyy-MM-dd')}`;

    switch (exportFormat.toLowerCase()) {
      case 'csv':
        const json2csvParser = new Json2csvParser({ fields });
        result = json2csvParser.parse(exportData);
        contentType = 'text/csv';
        fileName += '.csv';
        break;

      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        result = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName += '.xlsx';
        break;

      case 'json':
      default:
        result = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        fileName += '.json';
        break;
    }

    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // Send the file
    return res.send(result);

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting products',
      error: error.message
    });
  }
};

// Import products from file
export const importProducts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { originalname, path: filePath, mimetype } = req.file;
    const fileExt = path.extname(originalname).toLowerCase();
    const importId = uuidv4();
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      importId
    };

    // Read and parse the file based on its type
    let products = [];

    if (fileExt === '.csv' || mimetype === 'text/csv') {
      // Parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      products = await new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          cast: (value, context) => {
            if (context.column === 'price' || context.column === 'comparePrice') {
              return value ? parseFloat(value) : null;
            }
            if (context.column === 'quantity') {
              return value ? parseInt(value, 10) : 0;
            }
            if (context.column === 'isActive' || context.column === 'isFeatured' || context.column === 'hasVariants') {
              return value ? String(value).toLowerCase() === 'true' : false;
            }
            return value;
          }
        }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });
    } 
    else if (fileExt === '.json' || mimetype === 'application/json') {
      // Parse JSON file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      products = JSON.parse(fileContent);
      if (!Array.isArray(products)) {
        throw new Error('Invalid JSON format: expected an array of products');
      }
    } 
    else if (['.xlsx', '.xls'].includes(fileExt) || 
             mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
             mimetype === 'application/vnd.ms-excel') {
      // Parse Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      products = XLSX.utils.sheet_to_json(worksheet);
    } 
    else {
      throw new Error('Unsupported file format');
    }

    if (!products.length) {
      throw new Error('No products found in the file');
    }

    results.total = products.length;
    const categoriesMap = await getCategoriesMap();

    // Process products in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item, index) => {
          const productIndex = i + index + 1;
          try {
            const { processed, errors } = await processProductData(item, categoriesMap);
            
            if (errors.length > 0) {
              return {
                success: false,
                index: productIndex,
                errors
              };
            }

            // Check if product exists (update) or create new
            const existingProduct = await Product.findOne({ sku: processed.sku });
            
            if (existingProduct) {
              // Update existing product
              Object.assign(existingProduct, processed);
              await existingProduct.save({ session });
            } else {
              // Create new product
              const newProduct = new Product(processed);
              await newProduct.save({ session });
              
              // Create product stats entry
              const productStats = new ProductStats({
                product: newProduct._id,
                stock: {
                  current: newProduct.quantity || 0,
                  isLow: newProduct.quantity <= 10,
                  lowStockThreshold: 10
                }
              });
              await productStats.save({ session });
            }

            return { success: true, index: productIndex };
          } catch (error) {
            return {
              success: false,
              index: productIndex,
              errors: [error.message]
            };
          }
        })
      );

      // Update results
      batchResults.forEach(result => {
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            row: result.index,
            errors: result.errors
          });
        }
      });
    }

    await session.commitTransaction();
    session.endSession();
    
    // Clean up uploaded file
    try {
      await unlink(filePath);
    } catch (e) {
      console.error('Error deleting temp file:', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Import completed',
      data: results
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Clean up uploaded file in case of error
    if (req.file?.path) {
      try {
        await unlink(req.file.path);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    }

    console.error('Import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error importing products',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Download import template
export const downloadTemplate = async (req, res) => {
  try {
    const { format: templateFormat = 'csv' } = req.query;
    
    // Sample product with all possible fields
    const sampleProduct = {
      name: 'Sample Product',
      description: 'This is a sample product description',
      price: 99.99,
      comparePrice: 129.99,
      category: 'Electronics', // Will be matched by name
      sku: 'SP-001',
      quantity: 100,
      isActive: true,
      isFeatured: false,
      hasVariants: false,
      tags: 'sample,electronics,test',
      metaTitle: 'Sample Product - Best in Class',
      metaDescription: 'This is a sample product for demonstration purposes',
      'weight.value': 1.5,
      'weight.unit': 'kg',
      'dimensions.length': 20,
      'dimensions.width': 10,
      'dimensions.height': 5,
      'dimensions.unit': 'cm',
      variants: JSON.stringify([
        {
          sku: 'SP-001-RED',
          options: [
            { name: 'Color', value: 'Red' },
            { name: 'Size', value: 'M' }
          ],
          price: 99.99,
          comparePrice: 129.99,
          quantity: 50,
          isActive: true
        }
      ])
    };

    let result;
    let contentType;
    let fileName = `product-import-template-${format(new Date(), 'yyyy-MM-dd')}`;

    switch (templateFormat.toLowerCase()) {
      case 'csv':
        const fields = Object.keys(sampleProduct);
        const json2csvParser = new Json2csvParser({ 
          fields,
          header: true,
          quote: '"',
          delimiter: ',',
          eol: '\n'
        });
        
        // Add field descriptions as comments at the top
        const fieldDescriptions = {
          name: 'Product name (required)',
          description: 'Product description',
          price: 'Product price (number, required)',
          comparePrice: 'Original/compare price (number)',
          category: 'Category name (must exist in categories)',
          sku: 'Stock Keeping Unit (must be unique)',
          quantity: 'Available quantity (number)',
          isActive: 'Product is active (true/false)',
          isFeatured: 'Featured product (true/false)',
          hasVariants: 'Product has variants (true/false)',
          tags: 'Comma-separated tags',
          metaTitle: 'SEO meta title',
          metaDescription: 'SEO meta description',
          'weight.value': 'Product weight value',
          'weight.unit': 'Weight unit (g, kg, lb, oz)',
          'dimensions.length': 'Product length',
          'dimensions.width': 'Product width',
          'dimensions.height': 'Product height',
          'dimensions.unit': 'Dimension unit (mm, cm, in)',
          variants: 'JSON string of product variants (for products with variants)'
        };
        
        // Create CSV with comments
        let csvContent = '';
        fields.forEach(field => {
          csvContent += `# ${field}: ${fieldDescriptions[field] || field}\n`;
        });
        
        csvContent += '\n' + json2csvParser.parse([sampleProduct]);
        
        result = csvContent;
        contentType = 'text/csv';
        fileName += '.csv';
        break;

      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet([sampleProduct]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        
        // Add field descriptions to a second sheet
        const fieldData = Object.entries(fieldDescriptions).map(([field, description]) => ({
          Field: field,
          Description: description,
          Example: sampleProduct[field] || ''
        }));
        
        const ws2 = XLSX.utils.json_to_sheet(fieldData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Field Descriptions');
        
        result = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName += '.xlsx';
        break;

      case 'json':
      default:
        result = JSON.stringify([sampleProduct], null, 2);
        contentType = 'application/json';
        fileName += '.json';
        break;
    }

    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // Send the file
    return res.send(result);

  } catch (error) {
    console.error('Template download error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating template',
      error: error.message
    });
  }
};

// Get import status (for async imports)
export const getImportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // In a real implementation, you would fetch this from a database or cache
    // For now, we'll return a simple response
    return res.status(200).json({
      success: true,
      data: {
        importId: id,
        status: 'completed', // or 'processing', 'failed'
        message: 'Import completed successfully',
        // Additional status details would go here
      }
    });
  } catch (error) {
    console.error('Import status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting import status',
      error: error.message
    });
  }
};
