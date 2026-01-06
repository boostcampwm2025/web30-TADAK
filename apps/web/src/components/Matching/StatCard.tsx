interface Props {
  value: string | number;
  label: string;
}

export default function StatCard({ value, label }: Props) {
  return (
    <div className="flex-1 min-w-50 bg-bg-layer-1 rounded-2xl py-6 px-12 text-center">
      <div className="text-3xl font-bold text-green-05">{value}</div>
      <div className="text-sm text-base-secondary mt-2">{label}</div>
    </div>
  );
}
