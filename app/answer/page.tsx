import { Suspense } from 'react';
import AnswerContent from './AnswerContent';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Sedang memuatkan...</p>
    </div>
  );
}

export default function AnswerPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[480px] flex flex-col gap-4">
        <div className="text-center">
          <span className="text-2xl font-bold text-emerald-600">UstazBot</span>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <AnswerContent />
        </Suspense>
      </div>
    </main>
  );
}
