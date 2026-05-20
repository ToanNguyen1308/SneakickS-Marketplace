/**
 * Pagination helper — Week 5
 *
 * Chuan hoa cach doc ?page=&limit= tu req.query, ap dat min/max an toan,
 * va tao meta object thong nhat cho moi endpoint co paging.
 *
 * Co the dung 2 cach:
 *   1. parsePagination(req.query)  -> { page, limit, offset }
 *   2. buildMeta(page, limit, total) -> { page, limit, total, totalPages, hasNext, hasPrev }
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = (query = {}) => {
  let page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildMeta = (page, limit, total) => {
  const totalNumber = Number(total) || 0;
  const totalPages = totalNumber === 0 ? 0 : Math.ceil(totalNumber / limit);
  return {
    page,
    limit,
    total: totalNumber,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
