import { Trophy } from 'lucide-react';

function ResultHeader() {
  return (
    <div className="text-center">
      <div className="mb-1 flex justify-center">
        <div className="rounded-full bg-base-secondary/10 p-5">
          <Trophy className="h-7 w-7 text-base-secondary fill-base-secondary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-base-primary">결과</h1>
    </div>
  );
}

export default ResultHeader;
