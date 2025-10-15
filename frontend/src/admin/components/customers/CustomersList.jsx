import { useState } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiUserPlus } from "react-icons/fi";
import Pagination from "../orders/Pagination";

const CustomersList = ({
  customers,
  filters,
  onFilterChange,
  onEditCustomer,
  onDeleteCustomer,
  onAddCustomer,
  onRowClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Apply filters
  const filteredCustomers = customers.filter((customer) => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.company?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  // Pagination
  const indexOfLastCustomer = currentPage * itemsPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (customer, e) => {
    // Get the actual clicked element
    const target = e.target;
    
    // Check if the click was on a button, link, or any interactive element
    const isInteractive = target.matches('button, a, [role="button"], [onclick], .no-row-click') || 
                          target.closest('button, a, [role="button"], [onclick], .no-row-click');
    
    // If the click wasn't on an interactive element, trigger the row click
    if (!isInteractive) {
      onRowClick(customer);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header with search and actions */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Customers
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({filteredCustomers.length} total)
            </span>
          </h3>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search customers..."
                value={filters.search || ""}
                onChange={(e) => onFilterChange({ search: e.target.value })}
              />
            </div>
            <button
              onClick={onAddCustomer}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiUserPlus className="-ml-1 mr-2 h-5 w-5" />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentCustomers.length > 0 ? (
              currentCustomers.map((customer) => (
                <tr 
                  key={customer.id}
                  onClick={(e) => handleRowClick(customer, e)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-200 font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.company || "No company"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {customer.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {customer.ordersCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {customer.status || "inactive"}
                    </span>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-row-click"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomer(customer);
                        }}
                        className="no-row-click text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomer(customer.id);
                        }}
                        className="no-row-click text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCustomers.length > itemsPerPage && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCustomers.length}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CustomersList;