export const SIZE_SETS = {
  shoe: ["38", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "46"],
  apparel: ["XS", "S", "M", "L", "XL", "XXL"],
  os: ["OS"],
};

export const sizesFor = (sizeType) => SIZE_SETS[sizeType] || SIZE_SETS.shoe;
