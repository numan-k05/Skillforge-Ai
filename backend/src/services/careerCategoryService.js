import { listCategories } from "../models/careerCategoryModel.js";

function toPublic(row) {
  return {
    categoryId: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    displayOrder: row.display_order,
  };
}

export async function getCareerCategories() {
  const rows = await listCategories();
  return rows.map(toPublic);
}

export default { getCareerCategories };
