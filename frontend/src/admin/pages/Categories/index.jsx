import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiGrid, FiList } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMoveImmutable } from 'array-move';
import CategoriesFilter from '../../components/categories/CategoriesFilter';
import CategoriesTable from '../../components/categories/CategoriesTable';
import BulkActions from '../../components/categories/BulkActions';
import DragAndDropCategories from '../../components/categories/DragAndDropCategories';

// Mock data
let mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    image: 'https://images.unsplash.com/photo-1593642634524-b40b5baae6bb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active',
    productCount: 24,
    order: 1,
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Fashion and apparel',
    status: 'active',
    productCount: 42,
    order: 2,
  },
  {
    id: '3',
    name: 'Home & Garden',
    description: 'Furniture and home decor',
    status: 'inactive',
    productCount: 18,
    order: 3,
  },
];

// Sort categories by order
mockCategories = mockCategories.sort((a, b) => a.order - b.order);

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const navigate = useNavigate();

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setCategories(mockCategories);
        setFilteredCategories(mockCategories);
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...categories];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        cat => 
          cat.name.toLowerCase().includes(query) || 
          (cat.description && cat.description.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(cat => cat.status === statusFilter);
    }

    setFilteredCategories(result);
  }, [categories, searchQuery, statusFilter]);

  // Handle status toggle
  const handleStatusToggle = async (id, status) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, status } : cat
        )
      );
      
      toast.success(`Category ${status === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update category status');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
        
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      if (action === 'delete') {
        setCategories(prev => prev.filter(cat => !selectedItems.includes(cat.id)));
        toast.success(`${selectedItems.length} categories deleted`);
      } else {
        setCategories(prev => 
          prev.map(cat => 
            selectedItems.includes(cat.id) ? { ...cat, status: action } : cat
          )
        );
        toast.success(`${selectedItems.length} categories ${action === 'active' ? 'activated' : 'deactivated'}`);
      }
      
      setSelectedItems([]);
    } catch (error) {
      toast.error(`Failed to ${action} categories`);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Handle category reordering
  const handleReorder = useCallback((newOrder) => {
    // Update the order property of each category
    const updatedCategories = newOrder.map((cat, index) => ({
      ...cat,
      order: index + 1
    }));
    
    // In a real app, you would make an API call here to save the new order
    console.log('New order:', updatedCategories);
    setCategories(updatedCategories);
    toast.success('Categories reordered successfully');
  }, []);

  // Handle category selection
  const handleSelectItem = useCallback((id, isSelected) => {
    setSelectedItems(prev =>
      isSelected
        ? [...prev, id]
        : prev.filter(itemId => itemId !== id)
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((isSelected) => {
    setSelectedItems(isSelected ? filteredCategories.map(cat => cat.id) : []);
  }, [filteredCategories]);

  // Handle edit category
  const handleEdit = useCallback((id) => {
    navigate(`/admin/categories/edit/${id}`);
  }, [navigate]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {categories.filter(c => c.status === 'active').length} active, {categories.length} total
          </p>
        </div>
        <Link
          to="/admin/categories/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <FiPlus className="mr-2" />
          Add Category
        </Link>
      </div>

      {/* Filter */}
      <CategoriesFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={resetFilters}
      />

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredCategories.length} categories found
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            aria-label="Table view"
          >
            <FiList className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            aria-label="Grid view"
          >
            <FiGrid className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedCount={selectedItems.length}
          onBulkDelete={() => handleBulkAction('delete')}
          onBulkStatusToggle={(status) => handleBulkAction(status)}
          onClearSelection={() => setSelectedItems([])}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <CategoriesTable
                categories={filteredCategories}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onStatusToggle={handleStatusToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (active.id !== over?.id) {
                  setCategories((items) => {
                    const oldIndex = items.findIndex((item) => item.id === active.id);
                    const newIndex = items.findIndex((item) => item.id === over?.id);
                    const newOrder = arrayMoveImmutable(items, oldIndex, newIndex);
                    handleReorder(newOrder);
                    return newOrder;
                  });
                }
              }}
            >
              <DragAndDropCategories
                categories={filteredCategories}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onStatusToggle={handleStatusToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </DndContext>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Categories;