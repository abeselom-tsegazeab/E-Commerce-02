import Product from '../../models/product.model.js';
import { uploadImage as uploadToCloudinary, deleteImage as deleteFromCloudinary } from '../../lib/cloudinary.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to handle Cloudinary uploads
const handleImageUpload = async (file, folder = 'products') => {
  if (!file) return null;
  
  const result = await uploadToCloudinary(file, {
    folder,
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
};

// Add images to product
export const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const { setAsPrimary } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Upload all images
    const uploadPromises = files.map(file => handleImageUpload(file));
    const uploadResults = await Promise.all(uploadPromises);

    // Prepare new images array
    const newImages = uploadResults.map((img, index) => ({
      id: uuidv4(),
      url: img.url,
      publicId: img.publicId,
      altText: files[index].originalname.split('.')[0],
      isPrimary: setAsPrimary === 'true' && index === 0, // Set first as primary if specified
      order: product.images.length + index,
      metadata: {
        width: img.width,
        height: img.height,
        format: img.format,
        size: img.bytes
      }
    }));

    // If setting as primary, unset current primary
    if (setAsPrimary === 'true' && product.images.length > 0) {
      product.images = product.images.map(img => ({
        ...img.toObject(),
        isPrimary: false
      }));
    }

    // Add new images
    product.images = [...product.images, ...newImages];
    await product.save();

    res.status(201).json({
      success: true,
      data: newImages
    });
  } catch (error) {
    console.error('Error adding product images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// Update product image
export const updateProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const { altText, isPrimary, order } = req.body;
    
    const update = {};
    if (altText !== undefined) update['images.$.altText'] = altText;
    if (order !== undefined) update['images.$.order'] = parseInt(order);
    
    // Handle setting as primary
    if (isPrimary === 'true') {
      // First, unset all primary flags
      await Product.updateOne(
        { _id: id },
        { $set: { 'images.$[].isPrimary': false } }
      );
      
      // Then set the specified image as primary
      update['images.$.isPrimary'] = true;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, 'images._id': imageId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or image not found'
      });
    }

    res.json({
      success: true,
      data: product.images.id(imageId)
    });
  } catch (error) {
    console.error('Error updating product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    });
  }
};

// Delete product image
export const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // First get the image to delete
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const imageToDelete = product.images.id(imageId);
    if (!imageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    if (imageToDelete.publicId) {
      await deleteFromCloudinary(imageToDelete.publicId);
    }

    // Remove from product
    product.images.pull({ _id: imageId });
    
    // If we deleted the primary image and there are other images, set the first one as primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }
    
    await product.save();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// Set primary image
export const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // First unset all primary flags
    await Product.updateOne(
      { _id: id },
      { $set: { 'images.$[].isPrimary': false } }
    );
    
    // Then set the specified image as primary
    const product = await Product.findOneAndUpdate(
      { _id: id, 'images._id': imageId },
      { $set: { 'images.$.isPrimary': true } },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or image not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Primary image updated successfully',
      data: product.images.id(imageId)
    });
  } catch (error) {
    console.error('Error setting primary image:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary image',
      error: error.message
    });
  }
};

// Reorder images
export const reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;
    
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order array is required'
      });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Create a map of imageId to order
    const orderMap = new Map();
    order.forEach((imageId, index) => {
      orderMap.set(imageId.toString(), index);
    });
    
    // Update the order of each image
    product.images.forEach(image => {
      const newOrder = orderMap.get(image._id.toString());
      if (newOrder !== undefined) {
        image.order = newOrder;
      }
    });
    
    // Sort the images array by the new order
    product.images.sort((a, b) => a.order - b.order);
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Images reordered successfully',
      data: product.images
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering images',
      error: error.message
    });
  }
};
