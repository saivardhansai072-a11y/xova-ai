import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-24 md:pt-16 px-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-3 mb-8">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-screen md:pt-14 pb-20 md:pb-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex-1 px-4 py-6 space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`} />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border">
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function MentorSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 md:pt-16">
      <div className="max-w-lg w-full flex flex-col items-center text-center">
        <Skeleton className="w-[200px] h-[240px] rounded-2xl" />
        <Skeleton className="h-3 w-20 mt-2" />
        <Skeleton className="h-32 w-full mt-4 rounded-xl" />
        <div className="mt-5 flex items-center gap-4">
          <Skeleton className="w-11 h-11 rounded-full" />
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-11 h-11 rounded-full" />
          <Skeleton className="w-11 h-11 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full mt-4 rounded-xl" />
      </div>
    </div>
  );
}

export function InterviewSkeleton() {
  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="flex justify-center mb-6">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AptitudeSkeleton() {
  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-6 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
