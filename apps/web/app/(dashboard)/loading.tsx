export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
