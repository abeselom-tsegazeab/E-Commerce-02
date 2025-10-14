import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CategoryForm from '../../components/categories/CategoryForm';

// Mock function to fetch category by ID
const fetchCategory = async (id) => {
  // In a real app, this would be an API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockCategories = [
    {
      id: '1',
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      image: 'https://images.unsplash.com/photo-1593642634524-b40b5baae6bb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      status: 'active',
      parentId: ''
    },
    {
      id: '2',
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      status: 'active',
      parentId: '1'
    },
    {
      id: '3',
      name: 'Laptops',
      description: 'Laptops and notebooks',
      status: 'active',
      parentId: '1'
    },
  ];

  return mockCategories.find(cat => cat.id === id) || null;
};

const EditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock categories for parent category dropdown
  const mockCategories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Home & Garden' },
  ];

  // Fetch category data
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCategory(id);
        if (data) {
          setCategory(data);
        } else {
          toast.error('Category not found');
          navigate('/admin/categories');
        }
      } catch (error) {
        console.error('Error loading category:', error);
        toast.error('Failed to load category');
        navigate('/admin/categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategory();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically send the formData to your API
      console.log('Form submitted:', Object.fromEntries(formData));
      
      toast.success('Category updated successfully');
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Category not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Category</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update the category details
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg p-6">
        <CategoryForm
          initialData={category}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={mockCategories.filter(cat => cat.id !== id)} // Prevent selecting self as parent
        />
      </div>
    </div>
  );
};

export default EditCategory;
