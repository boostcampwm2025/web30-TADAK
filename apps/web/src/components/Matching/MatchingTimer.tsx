interface Props {
  time: number;
}

export default function MatchingTimer({ time }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-3xl bg-base-muted px-5 py-2">
      <span className="w-2 h-2 bg-red-500 rounded-full" />
      <span className="text-base-secondary">대기 시간: {time}초</span>
    </div>
  );
}
