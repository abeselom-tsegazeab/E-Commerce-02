import { useParams } from 'react-router-dom';
import ProductForm from '../../components/products/ProductForm';

const ProductFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ProductForm isEdit={isEdit} />
    </div>
  );
};

export default ProductFormPage;
