type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url?: string | null;
  badge?: string | null;
};

export function CategoryGrid({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          <h2 className="text-lg font-black text-foreground sm:text-xl tracking-wide">
            تسوّق حسب الأقسام الرئيسية
          </h2>
        </div>
        {active && (
          <button
            onClick={() => onSelect(null)}
            className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-xs"
          >
            إلغاء التصفية (عرض الكل)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 sm:gap-4">
        {categories.map((c) => {
          const isActive = active === c.id || active === c.slug;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(isActive ? null : c.id)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border text-start transition-all duration-300 ${
                isActive
                  ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-600/40 scale-[1.02]"
                  : "border-border/80 bg-card/90 backdrop-blur-sm hover:border-emerald-500/60 hover:bg-card hover:shadow-lg hover:-translate-y-1"
              }`}
            >
              {/* شارة التمييز */}
              {c.badge && (
                <span className="absolute start-2 top-2 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                  {c.badge}
                </span>
              )}

              {/* صورة القسم الفوتوغرافية عالية الجودة */}
              <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-secondary">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-emerald-100 dark:bg-emerald-950 text-3xl">
                    {c.icon ?? "🌿"}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              </div>

              {/* اسم القسم واختيار الفئة */}
              <div className="flex flex-1 items-center justify-between p-2.5 bg-card/90">
                <span
                  className={`line-clamp-1 text-xs font-black transition-colors ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-foreground group-hover:text-emerald-600"
                  }`}
                >
                  {c.name}
                </span>
                <div
                  className={`h-2 w-2 rounded-full transition-all ${
                    isActive ? "bg-emerald-600 scale-125" : "bg-border group-hover:bg-emerald-500"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
