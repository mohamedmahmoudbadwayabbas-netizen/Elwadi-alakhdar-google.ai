import { supabase } from "@/integrations/supabase/client";
import { COMPREHENSIVE_CATEGORIES, MOCK_PRODUCTS } from "./categories-data";

export async function autoSeedDatabaseIfNeeded() {
  try {
    // 1. Seed Categories if empty
    const { data: existingCats } = await supabase.from("categories").select("id").limit(1);
    if (!existingCats || existingCats.length === 0) {
      console.log("Seeding initial comprehensive categories...");
      for (const parentCat of COMPREHENSIVE_CATEGORIES) {
        const { data: parentRes, error: pErr } = await supabase
          .from("categories")
          .upsert({
            id: parentCat.id,
            name: parentCat.name,
            slug: parentCat.slug,
            icon: parentCat.icon || null,
            image_url: parentCat.image_url || null,
            sort_order: parentCat.sort_order,
            parent_id: null,
          })
          .select("id")
          .maybeSingle();

        if (pErr) {
          console.warn("Failed parent category upsert:", pErr.message);
        }

        const parentId = parentRes?.id || parentCat.id;

        if (parentCat.subcategories && parentCat.subcategories.length > 0) {
          const subPayloads = parentCat.subcategories.map((sub, idx) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            icon: sub.icon || null,
            image_url: sub.image_url || null,
            sort_order: idx + 1,
            parent_id: parentId,
          }));
          await supabase.from("categories").upsert(subPayloads);
        }
      }
    }

    // 2. Seed Products if empty
    const { data: existingProds } = await supabase.from("products").select("id").limit(1);
    if (!existingProds || existingProds.length === 0) {
      console.log("Seeding initial mock products into Supabase...");
      const prodPayloads = MOCK_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        category_id: p.category_id || null,
        price: p.price_per_unit,
        original_price: p.old_price || null,
        image_url: p.image_url || null,
        stock: p.stock_quantity ?? 100,
        is_featured: true,
        is_active: true,
      }));

      const { error: prodErr } = await supabase.from("products").upsert(prodPayloads);
      if (prodErr) {
        console.warn("Error seeding products:", prodErr.message);
      }
    }
  } catch (err) {
    console.error("Auto-seed error:", err)d
}
