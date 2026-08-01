import { supabase } from "@/integrations/supabase/client";

export type CouponValidationResult = {
  isValid: boolean;
  discountAmount: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  message: string;
  couponId?: string;
  code?: string;
};

/**
 * Validates a coupon code against Supabase rules & current cart total
 */
export async function validateCouponCode(
  code: string,
  cartTotal: number,
  isFirstOrder: boolean = false,
): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      discountAmount: 0,
      discountType: "percent",
      discountValue: 0,
      message: "يرجى إدخال كود الخصم أولاً",
    };
  }

  try {
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error || !coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        discountType: "percent",
        discountValue: 0,
        message: "كود الخصم غير صحيح أو غير موجود",
      };
    }

    const discountType = (coupon.discount_type as "fixed" | "percent") || "percent";

    if (!coupon.is_active) {
      return {
        isValid: false,
        discountAmount: 0,
        discountType,
        discountValue: coupon.discount_value || 0,
        message: "كود الخصم غير مفعّل حالياً",
      };
    }

    // Check expiration date
    if (coupon.expires_at) {
      const expiryDate = new Date(coupon.expires_at);
      if (expiryDate < new Date()) {
        return {
          isValid: false,
          discountAmount: 0,
          discountType,
          discountValue: coupon.discount_value || 0,
          message: "انتهت صلاحية كود الخصم هذا",
        };
      }
    }

    // Check minimum order amount requirement
    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      return {
        isValid: false,
        discountAmount: 0,
        discountType,
        discountValue: coupon.discount_value || 0,
        message: `الحد الأدنى لتفعيل هذا الكوبون هو ${coupon.min_order_amount} ج.م`,
      };
    }

    // Check maximum usage limit
    if (coupon.max_uses && coupon.uses_count && coupon.uses_count >= coupon.max_uses) {
      return {
        isValid: false,
        discountAmount: 0,
        discountType,
        discountValue: coupon.discount_value || 0,
        message: "تجاوز هذا الكوبون الحد الأقصى للمرات المسموحة للاستخدام",
      };
    }

    // Check first order only condition
    if (coupon.first_order_only && !isFirstOrder) {
      return {
        isValid: false,
        discountAmount: 0,
        discountType,
        discountValue: coupon.discount_value || 0,
        message: "هذا الكوبون مخصص للعملاء الجدد في الطلب الأول فقط",
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
    } else {
      discountAmount = Math.min(coupon.discount_value, cartTotal);
    }

    return {
      isValid: true,
      discountAmount: Number(discountAmount.toFixed(2)),
      discountType,
      discountValue: coupon.discount_value || 0,
      message: `تم تفعيل خصم بقيمة ${discountAmount.toFixed(2)} ج.م بنجاح 🎉`,
      couponId: coupon.id,
      code: coupon.code,
    };
  } catch (err: any) {
    return {
      isValid: false,
      discountAmount: 0,
      discountType: "percent",
      discountValue: 0,
      message: `حدث خلل أثناء التحقق: ${err.message}`,
    };
  }
}
