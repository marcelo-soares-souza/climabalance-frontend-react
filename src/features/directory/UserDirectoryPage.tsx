import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Trees, MapPin, Users, ArrowRight } from "lucide-react";
import type { DirectoryItem } from "@/services/users";

const DEFAULT_AVATAR = "/avatar-placeholder.png";

function UserCard({ user }: { user: DirectoryItem }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/users/${user.slug}/profile`)}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-3">
          <img
            src={user.avatarUrl ?? DEFAULT_AVATAR}
            alt={user.displayName ?? user.slug}
            className="h-14 w-14 rounded-full object-cover bg-gray-100 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">
              {user.displayName ?? user.slug}
            </h3>
            <p className="text-xs text-text-secondary">@{user.slug}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-secondary shrink-0" />
        </div>

        {user.about && (
          <p className="text-sm text-text-secondary line-clamp-3 mb-3 leading-relaxed">
            {user.about}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {user.totalAreas} {t("directory.areas")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Trees className="h-3.5 w-3.5" />
            {user.totalTrees} {t("directory.trees")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UserDirectoryPage() {
  const { t } = useTranslation();

  const { data: users, isLoading } = useQuery({
    queryKey: ["user-directory"],
    queryFn: () => usersService.listDirectory({ limit: 50 }),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <Users className="h-10 w-10 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold font-display mb-2">
          {t("directory.title")}
        </h1>
        <p className="text-text-secondary">
          {t("directory.description")}
        </p>
      </div>

      {isLoading ? (
        <UserCardsSkeleton />
      ) : users && users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <UserCard key={user.slug} user={user} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("directory.noUsers")}
        />
      )}
    </div>
  );
}
