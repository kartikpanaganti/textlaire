export function Input({ className, ...props }) {
    return (
      <input
        className={`px-4 py-2 bg-gray-700 text-white rounded w-full ${className}`}
        {...props}
      />
    );
  }
  