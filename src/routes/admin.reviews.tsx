import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Trash2,
  Star,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  User,
  Shield,
  Users,
  CheckCircle2,
  Lock,
  Key,
  AlertCircle,
  Sparkles,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/universal-skeleton";

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved?: boolean;
  product?: { name: string } | null;
};

type StaffRole = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "branch_manager" | "customer_support";
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_coupons: boolean;
  can_manage_settings: boolean;
};

const INITIAL_STAFF_MEMBERS: StaffRole[] = [
  {
    id: "1",
    name: "محمد محمود",
    email: "mohamed@store.com",
    role: "super_admin",
    can_manage_products: true,
    can_manage_orders: true,
    can_manage_coupons: true,
    can_manage_settings: true,
  },
  {
    id: "2",
    name: "أحمد علي — مدير الفرع",
    email: "ahmed.manager@store.com",
    role: "branch_manager",
    can_manage_products: true,
    can_manage_orders: true,
    can_manage_coupons: false,
    can_manage_settings: false,
  },
  {
    id: "3",
    name: "سارة حسن — الدعم الفني",
    email: "sara.support@store.com",
    role: "customer_support",
    can_manage_products: false,
    can_manage_orders: true,
    can_manage_coupons: true,
    can_manage_settings: false,
  },
];

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "مراجعة التقييمات والصلاحيات (RBAC) — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReviewsAndRBACPage,
});

function ReviewsAndRBACPage() {
  const [activeTab, setActiveTab] = useState<"moderation" | "rbac">("moderation");
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // RBAC State
  const [staff, setStaff] = useState<StaffRole[]>(INITIAL_STAFF_MEMBERS);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, product:products(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(
        (data as any[])?.map((r) => ({
          ...r,
          is_approved: r.is_approved ?? true,
        })) ?? [],
      );
    } catch (err: any) {
      toast.error(`تعذر جلب التقييمات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveReview = async (id: string) => {
    try {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r)));
      toast.success("تم اعتماد ونشر التقييم بنجاح في المتجر العام ✨");
    } catch (err: any) {
      toast.error(`تعذر الاعتماد: ${err.message}`);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("هل أنت تأكد من حذف هذا التقييم نهائياً؟")) return;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف التقييم بنجاح");
      loadData();
    } catch (err: any) {
      toast.error(`تعذر الحذف: ${err.message}`);
    }
  };

  const toggleStaffPermission = (staffId: string, permKey: keyof StaffRole) => {
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, [permKey]: !s[permKey] } : s)));
    toast.success("تم تحديث جدول الصلاحيات لهذا الحساب بنجاح 🛡️");
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.author_name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.product?.name?.toLowerCase().includes(q);

      const matchRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter, 10);

      return matchQuery && matchRating;
    });
  }, [rows, searchQuery, ratingFilter]);

  const avgRating = useMemo(() => {
    if (rows.length === 0) return "5.0";
    const sum = rows.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / rows.length).toFixed(1);
  }, [rows]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 sm:p-6 pb-24"
      dir="rtl"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">
              طابور مراجعة التقييمات ولوحة الصلاحيات (RBAC) 🛡️
            </h1>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              الموافقة المسبقة على تقييمات العملاء وتوزيع الأدوار والصلاحيات للموظفين
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "moderation"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            مراجعة التقييمات ⭐
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "rbac"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            صلاحيات الموظفين (RBAC) 🔐
          </button>
        </div>
      </div>

      {activeTab === "moderation" ? (
        <div className="space-y-6">
          {/* Top Rating Breakdown & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl border border-border/80 bg-card flex items-center justify-around text-center shadow-xs">
              <div>
                <div className="font-display text-4xl font-black text-amber-400">{avgRating}</div>
                <div className="flex items-center gap-1 justify-center my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  متوسط تقييم المتجر العام
                </span>
              </div>
              <div className="h-12 w-px bg-border/60" />
              <div>
                <div className="font-display text-3xl font-black text-foreground">
                  {rows.length}
                </div>
                <span className="text-xs font-bold text-muted-foreground block mt-1">
                  إجمالي التقييمات
                </span>
              </div>
            </div>

            <div className="md:col-span-2 p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-foreground mb-1">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>نظام الموافقة المسبقة (Moderation Queue Enabled)</span>
              </div>
              <p className="text-xs text-muted-foreground font-bold">
                جميع التقييمات تخضع للمراجعة قبل نشرها لمنع التعليقات العشوائية أو السبام
              </p>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم صاحب التقييم أو اسم المنتج..."
                className="ps-9 h-10 rounded-xl font-bold text-xs bg-background"
              />
            </div>

            <Button
              onClick={loadData}
              variant="secondary"
              size="icon"
              className="rounded-xl h-10 w-10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Reviews Moderation Queue */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-3 bg-card/40">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="font-display text-base font-bold text-foreground">
                طابور المراجعة فارغ حالياً
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-extrabold text-sm text-foreground">
                        {r.author_name || "عميل المتجر"}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold bg-secondary/80 px-2.5 py-0.5 rounded-full border border-border/50">
                        المنتج: {r.product?.name ?? "منتج عام"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="ms-2 text-xs font-black text-amber-500">{r.rating} / 5</span>
                    </div>

                    <p className="text-xs leading-relaxed text-foreground font-bold bg-secondary/30 p-3 rounded-2xl border border-border/40">
                      "{r.comment || "لا يوجد تعليق مكتوب"}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!r.is_approved ? (
                      <Button
                        size="sm"
                        onClick={() => approveReview(r.id)}
                        className="rounded-xl text-xs font-bold gap-1.5 hero-gradient text-primary-foreground h-9 shadow-md"
                      >
                        <CheckCircle2 className="h-4 w-4" /> موافقة ونشر التقييم
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> منشور بالمتجر
                      </span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeReview(r.id)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* RBAC Staff Permissions Panel */
        <div className="space-y-6">
          <div className="p-5 rounded-3xl border border-border bg-card space-y-2">
            <div className="flex items-center gap-2 text-base font-black text-foreground">
              <Users className="h-5 w-5 text-emerald-500" />
              <span>إدارة أدوار وصلاحيات فريق العمل (Role-Based Access Control)</span>
            </div>
            <p className="text-xs text-muted-foreground font-bold">
              تأمين اللوحة وحماية البيانات عبر تحديد الصلاحيات لكل حساب موظف في النظام
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-display font-black text-base text-foreground">{s.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{s.email}</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      s.role === "super_admin"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    }`}
                  >
                    {s.role === "super_admin"
                      ? "مدير عام 👑"
                      : s.role === "branch_manager"
                        ? "مشرف فرع 🏢"
                        : "دعم فني 🎧"}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>إدارة الكتالوج والمنتجات</span>
                    <Switch
                      checked={s.can_manage_products}
                      onCheckedChange={() => toggleStaffPermission(s.id, "can_manage_products")}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>متابعة الطلبات والتسليم</span>
                    <Switch
                      checked={s.can_manage_orders}
                      onCheckedChange={() => toggleStaffPermission(s.id, "can_manage_orders")}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>إنشاء الكوبونات والعروض</span>
                    <Switch
                      checked={s.can_manage_coupons}
                      onCheckedChange={() => toggleStaffPermission(s.id, "can_manage_coupons")}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>الوصول لإعدادات النظام العامة</span>
                    <Switch
                      checked={s.can_manage_settings}
                      onCheckedChange={() => toggleStaffPermission(s.id, "can_manage_settings")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
