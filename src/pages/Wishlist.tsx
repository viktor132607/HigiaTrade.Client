import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { removeFromWishlist } from "../store/slices/userSlice";
import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { addItem } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/currency";

interface Product {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
  discountPercentage?: number;
  discountedPrice?: number;
}

const Wishlist = () => {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wishlist } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        setLoading(true);
        const products = await Promise.all(
          wishlist.map(async (productId) => {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (!response.ok) {
              throw new Error("We could not load one of the saved products.");
            }
            return response.json();
          })
        );
        setWishlistProducts(products);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We could not load your saved products."
        );
      } finally {
        setLoading(false);
      }
    };

    if (wishlist.length > 0) {
      fetchWishlistProducts();
    } else {
      setLoading(false);
    }
  }, [wishlist, token]);

  const handleRemoveFromWishlist = (productId: string) => {
    dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = (product: Product) => {
    dispatch(
        addItem({
          id: product.id,
          title: product.title,
          regularPrice: product.regularPrice,
          discountedPrice: product.discountedPrice,
          discountPercentage: product.discountPercentage,
          quantity: 1,
          mainImageUrl: product.mainImageUrl,
          imageUrl: "",
      })
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-lg">
          <HeartIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Save products here so you can come back to them later.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-primary-500 text-white px-6 py-3 rounded-md hover:text-gray-900 hover:bg-primary-600 transition-colors"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
          <span className="text-gray-600">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? "product" : "products"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => {
            const displayPrice =
              product.discountedPrice && product.discountedPrice > 0
                ? product.discountedPrice
                : product.regularPrice;

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-[2rem] bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
              >
              <div className="relative">
                <div className="aspect-square w-full overflow-hidden bg-gray-200">
                  <img
                    src={product.mainImageUrl || "/placeholder-image.jpg"}
                    alt={product.title}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Remove from wishlist"
                >
                  <HeartIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  <Link
                    to={`/products/${product.id}`}
                    className="hover:text-primary-500"
                  >
                    {product.title}
                  </Link>
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(displayPrice)}
                    </p>
                    {product.discountedPrice && product.discountedPrice > 0 && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatCurrency(product.regularPrice)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 flex items-center justify-center bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Add to cart
                  </button>
                  <Link
                    to={`/products/${product.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    View details
                  </Link>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
