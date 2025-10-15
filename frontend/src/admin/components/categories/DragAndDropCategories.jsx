import { useState } from 'react';
import { arrayMoveImmutable } from 'array-move';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMenu, FiTrash2, FiEdit2, FiEye, FiEyeOff } from 'react-icons/fi';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const SortableItem = ({ id, category, onDelete, onStatusToggle, isSelected, onSelect, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200 dark:border-gray-700'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-grab active:cursor-grabbing"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(id, e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 mr-3"
        />

        {category.image && (
          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden mr-3">
            <img
              src={category.image}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {category.name}
          </p>
          {category.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
        <span className={`px-2 py-1 text-xs rounded-full ${
          category.status === 'active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {category.status === 'active' ? 'Active' : 'Inactive'}
        </span>
        
        <button
          type="button"
          onClick={() => onStatusToggle(id, category.status === 'active' ? 'inactive' : 'active')}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
        >
          {category.status === 'active' ? (
            <FiEyeOff className="h-4 w-4" />
          ) : (
            <FiEye className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit(id)}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(id)}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const DragAndDropCategories = ({
  categories = [],
  onReorder = () => {},
  onDelete = () => {},
  onStatusToggle = () => {},
  onEdit = () => {},
  selectedItems = [],
  onSelectItem = () => {},
  onSelectAll = () => {}
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMoveImmutable(categories, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No categories found</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map(cat => cat.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {categories.map((category) => (
            <SortableItem
              key={category.id}
              id={category.id}
              category={category}
              onDelete={onDelete}
              onStatusToggle={onStatusToggle}
              onEdit={onEdit}
              isSelected={selectedItems.includes(category.id)}
              onSelect={onSelectItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DragAndDropCategories;