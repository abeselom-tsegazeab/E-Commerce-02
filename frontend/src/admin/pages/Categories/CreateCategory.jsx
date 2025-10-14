import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CategoryForm from '../../components/categories/CategoryForm';

const CreateCategory = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock categories for parent category dropdown
  const mockCategories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Home & Garden' },
  ];

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically send the formData to your API
      console.log('Form submitted:', Object.fromEntries(formData));
      
      toast.success('Category created successfully');
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Category</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add a new product category to your store
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg p-6">
        <CategoryForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={mockCategories}
        />
      </div>
    </div>
  );
};

export default CreateCategory;
