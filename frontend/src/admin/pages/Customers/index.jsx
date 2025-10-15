import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign, FiPlus } from 'react-icons/fi';
import CustomersList from '../../components/customers/CustomersList';
import CustomerForm from '../../components/customers/CustomerForm';
import CustomerDetails from '../../components/customers/CustomerDetails';
import CustomersFilter from '../../components/customers/CustomersFilter';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'newest',
  });

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockCustomers = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 (555) 123-4567',
            company: 'Acme Inc',
            address: '123 Main St, New York, NY 10001',
            status: 'active',
            createdAt: '2023-01-15T10:30:00Z',
            ordersCount: 5,
            totalSpent: 1250.75,
          },
          // Add more mock customers as needed
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1 (555) 987-6543',
            company: 'Tech Corp',
            address: '456 Oak Ave, San Francisco, CA 94105',
            status: 'active',
            createdAt: '2023-02-20T14:45:00Z',
            ordersCount: 12,
            totalSpent: 3250.30,
          },
          {
            id: '3',
            name: 'Robert Johnson',
            email: 'robert@example.com',
            phone: '+1 (555) 456-7890',
            company: '',
            address: '789 Pine St, Chicago, IL 60601',
            status: 'inactive',
            createdAt: '2023-03-10T09:15:00Z',
            ordersCount: 2,
            totalSpent: 450.50,
          },
          {
            id: '4',
            name: 'Emily Davis',
            email: 'emily@example.com',
            phone: '+1 (555) 789-0123',
            company: 'Design Studio',
            address: '321 Elm St, Austin, TX 73301',
            status: 'active',
            createdAt: '2023-04-05T11:20:00Z',
            ordersCount: 8,
            totalSpent: 1875.90,
          },
          {
            id: '5',
            name: 'Michael Brown',
            email: 'michael@example.com',
            phone: '+1 (555) 234-5678',
            company: 'Brown & Co',
            address: '159 Maple Dr, Seattle, WA 98101',
            status: 'inactive',
            createdAt: '2023-05-15T16:30:00Z',
            ordersCount: 1,
            totalSpent: 199.99,
          }
        ];
        
        setCustomers(mockCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter and sort customers
  const getFilteredAndSortedCustomers = () => {
    let result = [...customers];

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(customer => customer.status === filters.status);
    }

    // Apply search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
        (customer.company && customer.company.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  };

  const filteredCustomers = getFilteredAndSortedCustomers();

  // Calculate customer statistics
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalSpent: customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0).toFixed(2),
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerForm(true);
  };

 const handleViewCustomer = (customer) => {
  setSelectedCustomer(customer);
  setShowCustomerDetails(true);
  setShowCustomerForm(false); // Ensure form is closed when viewing details
};

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      // In a real app, you would make an API call to delete the customer
      console.log('Deleting customer:', customerId);
      setCustomers(customers.filter(customer => customer.id !== customerId));
    }
  };

  const handleSaveCustomer = (customerData) => {
    if (customerData.id) {
      // Update existing customer
      setCustomers(customers.map(c => 
        c.id === customerData.id ? { ...c, ...customerData } : c
      ));
    } else {
      // Add new customer
      const newCustomer = {
        ...customerData,
        id: `cust_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0,
      };
      setCustomers([newCustomer, ...customers]);
    }
    setShowCustomerForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Customers
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                {customers.length} total
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddCustomer}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <FiPlus className="-ml-0.5 mr-1.5 h-4 w-4" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Customers */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 transition-colors duration-300">
                    <FiUsers className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {stats.total}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Customers */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 transition-colors duration-300">
                    <FiUserCheck className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {stats.active}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Inactive Customers */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200 transition-colors duration-300">
                    <FiUserX className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {stats.inactive}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Revenue */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 transition-colors duration-300">
                    <FiDollarSign className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      ${stats.totalSpent}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Customers List */}
      <div className="space-y-4">
        <CustomersFilter 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })} 
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <CustomersList
  customers={filteredCustomers}
  filters={filters}
  onFilterChange={setFilters}  // Changed from handleFilterChange to setFilters
  onEditCustomer={handleEditCustomer}
  onDeleteCustomer={handleDeleteCustomer}
  onAddCustomer={handleAddCustomer}
  onRowClick={handleViewCustomer}
/>
        )}
      </div>

      {/* Customer Form Modal */}
      <CustomerForm
        customer={selectedCustomer}
        isOpen={showCustomerForm}
        onSave={handleSaveCustomer}
        onCancel={() => setShowCustomerForm(false)}
      />

      {/* Customer Details Modal */}
      {selectedCustomer && (
       <CustomerDetails
  customer={selectedCustomer}
  onClose={() => {
    setShowCustomerDetails(false);
    setSelectedCustomer(null);
  }}
/>
      )}
    </div>
  );
};

export default Customers;