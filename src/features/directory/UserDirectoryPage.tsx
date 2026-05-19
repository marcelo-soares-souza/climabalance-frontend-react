import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { Card, CardContent } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Users, Trees, MapPin, FilterX } from "lucide-react";
import { countries } from "@/lib/countries";
import type { DirectoryItem } from "@/services/users";
import { getUserProfilePath } from "@/lib/public-refs";

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));

function AvatarPlaceholder({ name, size }: { name: string; size: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary-50 text-primary font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </div>
  );
}

function UserCard({ user }: { user: DirectoryItem }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayName = user.displayName ?? user.slug;

  return (
    <Card
      className="h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => navigate(getUserProfilePath(user))}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-14 w-14 rounded-full object-cover bg-gray-100 shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target
                  .parentElement!.querySelector(".avatar-fallback")
                  ?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`${user.avatarUrl ? "hidden" : ""} avatar-fallback`}>
            <AvatarPlaceholder name={displayName} size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold leading-snug">{displayName}</h3>
            {user.countryCode && (
              <p className="text-sm text-text-secondary">
                {countries.find((c) => c.code === user.countryCode)?.name ??
                  user.countryCode}
              </p>
            )}
          </div>
        </div>

        {user.about && (
          <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
            {user.about}
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-3 pt-2 text-center">
          <div className="rounded-lg bg-emerald-50 p-3">
            <MapPin className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-700">
              {user.totalAreas}
            </p>
            <p className="text-xs text-emerald-600">{t("directory.areas")}</p>
          </div>
          <div className="rounded-lg bg-primary-50 p-3">
            <Trees className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-primary">{user.totalTrees}</p>
            <p className="text-xs text-primary">{t("directory.trees")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-lg shadow-md animate-pulse">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-gray-200 rounded-lg" />
              <div className="h-16 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserDirectoryPage() {
  const { t } = useTranslation();
  const [countryFilter, setCountryFilter] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["user-directory"],
    queryFn: () => usersService.listDirectory({ limit: 50 }),
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!countryFilter) return users;
    return users.filter((u) => u.countryCode === countryFilter);
  }, [users, countryFilter]);

  const hasFilters = Boolean(countryFilter);

  const clearFilters = () => {
    setCountryFilter("");
  };

  return (
    <>
      <SEO title={t("seo.userDirectory.title")} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("directory.title")}</h1>
          <p className="text-text-secondary mt-1">
            {t("directory.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Combobox
            id="directory-country"
            label={t("area.form.country")}
            value={countryFilter}
            options={countryOptions}
            emptyLabel={t("map.allCountries")}
            placeholder={t("area.form.selectCountry")}
            onChange={(val) => setCountryFilter(val)}
          />
        </div>

        {hasFilters && (
          <div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="h-4 w-4 mr-1" />{" "}
              {t("areas.list.clearFilters")}
            </Button>
          </div>
        )}

        {isLoading ? (
          <UserCardsSkeleton />
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title={t("directory.noUsers")}
          />
        )}
      </div>
    </>
  );
}
