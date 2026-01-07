export default function LoadingSpinner() {
  return (
    <div className="flex justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-green-01 rounded-full" />
        <div className="absolute inset-0 border-4 border-green-05 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
