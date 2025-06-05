import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">404</h2>
          <p className="text-xl font-medium text-gray-900 mb-4">Page Not Found</p>
          <p className="text-gray-500 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;