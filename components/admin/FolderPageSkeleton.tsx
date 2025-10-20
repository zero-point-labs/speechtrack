import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Folder } from "lucide-react"

export function FolderPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            {/* Back button and title skeleton */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-20" />
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <Folder className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-300" />
                  <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-4 w-80" />
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-28" />
            </div>
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sessions List Skeleton */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Sessions header */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
              
              {/* Session items skeleton */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-18" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
