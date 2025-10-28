import { Helmet } from 'react-helmet-async';
import ProductList from '../components/products/ProductList';

export default function ShopPage() {
  return (
    <div>
      <Helmet>
        <title>Shop - Your E-commerce Store</title>
        <meta name="description" content="Browse our collection of high-quality products" />
      </Helmet>
      
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-8 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
            <p className="mt-2 text-sm text-gray-500">
              Browse our collection of high-quality products
            </p>
          </div>
          
          {/* Product List with Filters */}
          <ProductList />
        </div>
      </div>
    </div>
  );
}
