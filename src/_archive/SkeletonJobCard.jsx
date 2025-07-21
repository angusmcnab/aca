// src/components/SkeletonJobCard.jsx

export default function SkeletonJobCard() {
  return (
    <div className="p-4">
      <div className="animate-pulse flex justify-between items-center">
        <div>
          <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="text-right">
          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}