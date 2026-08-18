"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../store/slices/userSlice";
import {
  StarIcon,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { RootState } from "../store";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/currency";


interface Product {
  id: string;
  title: string;
  description: string;
  regularPrice: number;
  mainImageUrl: string;
  secondaryImages: Array<{
    id: string | null;
    uri: string;
  }>;
  categoryId: string;
  quantity: number;
  rating: number;
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  discountPercentage?: number;
  discountedPrice?: number;
}

interface ReviewItem {
  id: string;
  content: string;
  rating: number;
  createdOn: string;
  userId: string;
  userNames: string;
}

const getUserIdFromToken = (token: string): string | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ];
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const calculateAverageRating = (reviews: ReviewItem[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdOn");
  const [sortDescending, setSortDescending] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);

  const currentUserId = token ? getUserIdFromToken(token) : null;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products/${id}`
        );

        if (!response.ok) {
          throw new Error("We could not load this product.");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We could not load this product."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchReviews = async () => {
    if (!product) return;

    try {
      const queryParams = new URLSearchParams({
        ProductId: product.id,
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Reviews?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        throw new Error("We could not load the reviews.");
      }

      const data = await response.json();
      setReviews(data.items);

      const newAverageRating = calculateAverageRating(data.items);
      setProduct((prev) =>
        prev ? { ...prev, rating: newAverageRating } : prev
      );

      setTotalPages(Math.ceil(data.totalCount / pageSize));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("We could not load the reviews.");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product?.id, pageNumber, pageSize, sortBy, sortDescending]);

  const handleAddToCart = async () => {
    if (!token) {
      toast.error("Sign in to add this product to your cart.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    if (!product) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: quantity,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add product to cart");
      }

      toast.success("Product added to cart.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("We could not add this product to your cart.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const isInWishlist = product ? wishlist.includes(product.id) : false;

  const handleWishlistToggle = () => {
    if (!product) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Wishlist/add-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: product.id }),
    });

    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast.info("Removed from wishlist.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      dispatch(addToWishlist(product.id));
      toast.success("Added to wishlist.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !product) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          content: newReviewComment,
          rating: newReviewRating,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setNewReviewRating(0);
      setNewReviewComment("");

      await fetchReviews();

      toast.success("Thanks for sharing your review.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch {
      toast.error("We could not publish your review.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const deleteReview = async (id: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Reviews/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: token,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete review");
        }

        toast.success("Review deleted.");
        fetchReviews();
      } catch {
        toast.error("We could not delete this review.");
      }
    };

    const DeleteConfirmationToast = () => (
      <div className="p-4">
        <p className="text-gray-700 mb-4">Delete this review?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              toast.dismiss();
              deleteReview(reviewId);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete review
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );

    toast(<DeleteConfirmationToast />, {
      position: "bottom-right",
      autoClose: false,
      closeOnClick: false,
      draggable: true,
      closeButton: false,
      className: "w-80",
    });
  };

  const handleEditReview = async (reviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Reviews/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: reviewId,
            content: editContent,
            rating: editRating,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update review");
      }

      toast.success("Review updated.");
      setEditingReviewId(null);
      fetchReviews();
    } catch {
      toast.error("We could not update this review.");
    }
  };

  const startEditing = (review: ReviewItem) => {
    setEditingReviewId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg text-red-600">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const imagesCount = product.secondaryImages?.length
    ? product.secondaryImages.length + 1
    : 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ToastContainer />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-gray-100">
              <img
                src={
                  selectedImage === 0
                    ? product.mainImageUrl
                    : product.secondaryImages[selectedImage - 1].uri
                }
                alt={product.title}
                className="h-full w-full object-cover object-center"
              />

              {imagesCount > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        (prev - 1 + imagesCount) % imagesCount
                      )
                    }
                    className="group absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2.5 shadow-md transition-colors hover:border-primary-300"
                    aria-label="Previous image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500 group-hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedImage((prev) => (prev + 1) % imagesCount)
                    }
                    className="group absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2.5 shadow-md transition-colors hover:border-primary-300"
                    aria-label="Next image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500 group-hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {product.secondaryImages && product.secondaryImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <div
                  className={`aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-pointer transition-opacity hover:opacity-75 ${
                    selectedImage === 0 ? "ring-2 ring-primary-500" : ""
                  }`}
                  onClick={() => setSelectedImage(0)}
                >
                  <img
                    src={product.mainImageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {product.secondaryImages.map((image, index) => (
                  <div
                    key={index}
                    className={`aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-pointer transition-opacity hover:opacity-75 ${
                      selectedImage === index + 1
                        ? "ring-2 ring-primary-500"
                        : ""
                    }`}
                    onClick={() => setSelectedImage(index + 1)}
                  >
                    <img
                      src={image.uri}
                      alt={`${product.title} - Image ${index + 1}`}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${
                      i < (product.rating || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating
                  ? `${product.rating.toFixed(1)} out of 5`
                  : "No rating yet"}
                {reviews.length > 0 &&
                  ` (${reviews.length} ${
                    reviews.length === 1 ? "review" : "reviews"
                  })`}
              </span>
            </div>

            <div className="space-y-2">
              {product.discountPercentage ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(product.discountedPrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatCurrency(product.regularPrice)}
                  </span>
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm">
                    -{product.discountPercentage}%
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(product.regularPrice)}
                </span>
              )}
            </div>

            <div className="space-y-3 border-t border-b py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Availability:
                </span>
                <div className="flex items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full mr-2 ${
                      product.quantity > 10
                        ? "bg-green-500"
                        : product.quantity > 5
                        ? "bg-yellow-500"
                        : product.quantity > 0
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      product.quantity > 10
                        ? "text-green-700"
                        : product.quantity > 5
                        ? "text-yellow-700"
                        : product.quantity > 0
                        ? "text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    {product.quantity > 0 ? "In stock" : "Out of stock"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Units available:
                </span>
                <span
                  className={`text-sm font-medium ${
                    product.quantity > 10
                      ? "text-green-700"
                      : product.quantity > 5
                      ? "text-yellow-700"
                      : "text-red-700"
                  }`}
                >
                  {product.quantity} pcs
                </span>
              </div>
            </div>

            <div
              className="text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            {product.quantity > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-700"
                >
                  Quantity:
                </label>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min={1}
                    max={product.quantity}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(
                          product.quantity,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-16 text-center border-x py-2 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.quantity, quantity + 1))
                    }
                    className="px-3 py-2 text-gray-600 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                    disabled={quantity >= product.quantity}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  (Maximum: {product.quantity} pcs)
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleAddToCart}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${
                  product.quantity > 0
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={product.quantity === 0}
              >
                {product.quantity > 0 ? "Add to cart" : "Out of stock"}
              </button>
              {token && (
                <button
                  onClick={handleWishlistToggle}
                  className="flex items-center justify-center rounded-md border bg-gray-100 p-3 transition-colors hover:bg-primary-100 sm:w-auto"
                  title={
                    isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  {isInWishlist ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Customer reviews
          </h2>

          {token ? (
            <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Write a review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110 bg-transparent p-0"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            star <= newReviewRating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {newReviewRating
                      ? `${newReviewRating} ${
                          newReviewRating === 1 ? "star" : "stars"
                        }`
                      : "Choose a rating"}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Comment
                  </label>
                  <div className="rich-text-shell relative">
                    <textarea
                      value={newReviewComment}
                      onChange={(event) => setNewReviewComment(event.target.value)}
                      className="min-h-32 w-full rounded-md border border-gray-300 p-3 shadow-sm outline-none focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Share your experience with this product..."
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                    disabled={!newReviewRating || !newReviewComment.trim()}
                  >
                    Publish review
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-gray-600">
                Please{" "}
                <Link to="/login" className="text-primary-600 hover:underline">
                  sign in
                </Link>{" "}
                to leave a review.
              </p>
            </div>
          )}

          <div className="mt-12">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-gray-900">All reviews</h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="createdOn">Newest</option>
                  <option value="rating">Highest rated</option>
                </select>
                <button
                  onClick={() => setSortDescending(!sortDescending)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  {sortDescending ? "↓ Descending" : "↑ Ascending"}
                </button>
              </div>
            </div>

            {reviews.length > 0 ? (
              <>
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-lg p-6 shadow-sm border"
                    >
                      {editingReviewId === review.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditReview(review.id);
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating
                            </label>
                            <div className="flex space-x-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className="focus:outline-none"
                                >
                                  <StarIcon
                                    className={`w-6 h-6 ${
                                      star <= editRating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comment
                            </label>
                            <div className="rich-text-shell relative">
                              <textarea
                                value={editContent}
                                onChange={(event) => setEditContent(event.target.value)}
                                className="min-h-32 w-full rounded-md border border-gray-300 p-3 shadow-sm outline-none focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="submit"
                              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReviewId(null)}
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {review.userNames}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    review.createdOn
                                  ).toLocaleDateString("en-GB", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>

                            {currentUserId &&
                              review.userId === currentUserId && (
                                <div className="flex shrink-0 items-center gap-2 self-start">
                                  <button
                                    onClick={() => startEditing(review)}
                                    className="text-white hover:text-white p-1"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteReview(review.id)
                                    }
                                    className="text-white hover:text-white p-1"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              )}
                          </div>

                          <div className="mt-2">
                            <div
                              className="text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: review.content,
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPageNumber(1)}
                        disabled={pageNumber === 1}
                        className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ««
                      </button>
                      <button
                        onClick={() =>
                          setPageNumber((prev) => Math.max(1, prev - 1))
                        }
                        disabled={pageNumber === 1}
                        className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        «
                      </button>
                    </div>

                    <div className="flex max-w-full flex-wrap items-center gap-2">
                      {[...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx + 1}
                          onClick={() => setPageNumber(idx + 1)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                            pageNumber === idx + 1
                              ? "bg-primary-600 text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setPageNumber((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={pageNumber === totalPages}
                        className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »
                      </button>
                      <button
                        onClick={() => setPageNumber(totalPages)}
                        disabled={pageNumber === totalPages}
                        className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  There are no reviews for this product yet.
                </p>
                {token && (
                  <p className="text-gray-600 mt-2">
                    Be the first customer to share feedback.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;