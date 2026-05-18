import * as categoryModel from "../models/categoryModel.js";
import * as productModel from "../models/productModel.js";

export const getAllCategories = async (req, res) => {
  const result = await categoryModel.findAll();
  res.json({
    success: true,
    count: result.length,
    data: result,
  });
};

export const getProductsByCategoryId = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category id" });
  }

  const category = await categoryModel.findById(id);
  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  }

  const result = await productModel.findByCategory(id);

  res.json({
    success: true,
    category,
    count: result.length,
    data: result,
  });
};
