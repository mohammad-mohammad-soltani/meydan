import { Bone } from "@/features/feed/components/FeedSkeleton";

export function VideosGridSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => <Bone key={index} className="aspect-[9/16] w-full rounded-2xl" />)}
    </div>
  );
}
