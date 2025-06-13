import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ArticleCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  )
}

export function CommonHeadlineSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-4 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function NewsDigestSkeleton() {
  return (
    <div className="space-y-8 mt-6">
      <div>
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="space-y-4">
          <CommonHeadlineSkeleton />
          <CommonHeadlineSkeleton />
        </div>
      </div>
      <div>
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="space-y-8">
          <div>
            <Skeleton className="h-7 w-1/5 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
