import { FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff, FiCheck, FiMinus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

const ProductsTable = ({
  products = [],
  onDelete = () => {},
  onStatusToggle = () => {},
  onSelectItem = () => {},
  onSelectAll = () => {},
  selectedItems = [],
  getRowProps = () => ({}),
  isLoading = false,
}) => {
  // Add keyboard shortcuts
  useHotkeys('ctrl+a, command+a', (e) => {
    e.preventDefault();
    onSelectAll({ target: { checked: true } });
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No products found</p>
      </div>
    );
  }

  // Check if all items on current page are selected
  const allSelected = products.length > 0 && products.every(p => selectedItems.includes(p.id));
  // Check if some items are selected (but not all)
  const someSelected = !allSelected && products.some(p => selectedItems.includes(p.id));

  return (
    <div className="overflow-x-auto">
      <div className="align-middle inline-block min-w-full overflow-hidden">
        <table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          aria-label="Products table"
        >
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="relative w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  checked={allSelected}
                  ref={el => {
                    if (el) {
                      el.indeterminate = someSelected;
                    }
                  }}
                  onChange={onSelectAll}
                  aria-label={allSelected ? 'Deselect all products' : 'Select all products'}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product, index) => {
              const isSelected = selectedItems.includes(product.id);
              const rowProps = getRowProps(product, index);
              
              return (
                <tr 
                  key={product.id} 
                  className={`${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                  {...rowProps}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        checked={isSelected}
                        onChange={() => onSelectItem(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${product.name}`}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          className="h-full w-full object-cover"
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className={product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                      aria-label={`Status: ${product.status}`}
                    >
                      {product.status === 'published' ? (
                        <>
                          <FiCheck className="mr-1 h-3 w-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <FiMinus className="mr-1 h-3 w-3" />
                          Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {product.actions || (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusToggle(product.id, product.status === 'published' ? 'draft' : 'published');
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={product.status === 'published' ? 'Unpublish' : 'Publish'}
                          aria-label={product.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {product.status === 'published' ? (
                            <FiEyeOff className="h-4 w-4" />
                          ) : (
                            <FiEye className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                          aria-label={`Edit ${product.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete \"${product.name}\"?`)) {
                              onDelete(product.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete"
                          aria-label={`Delete ${product.name}`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;