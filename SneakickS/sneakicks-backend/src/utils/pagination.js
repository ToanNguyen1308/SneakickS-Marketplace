/**
 * Pagination helper — Week 5
 *
 * Chuan hoa cach doc ?page=&limit= tu req.query, ap dat min/max an toan,
 * va tao meta object thong nhat cho moi endpoint co paging.
 *
 * Co the dung 2 cach:
 *   1. parsePagination(req.query)  -> { page, limit, offset }   (OFFSET-based)
 *   2. buildMeta(page, limit, total) -> { page, limit, total, totalPages, hasNext, hasPrev }
 *
 * Week 6 bo sung keyset (cursor) pagination:
 *   3. parseCursor(req.query)        -> cursor (number) hoac null
 *   4. parseLimit(req.query)         -> limit da clamp an toan
 *   5. buildKeysetMeta(limit, rows, getId) -> { pageRows, meta }
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parseLimit = (query = {}) => {
  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return limit;
};

export const parsePagination = (query = {}) => {
  let page = Number.parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  const limit = parseLimit(query);

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

/**
 * Doc cursor tu query. Tra ve null neu khong co / khong hop le (-> trang dau).
 */
export const parseCursor = (query = {}) => {
  const cursor = Number.parseInt(query.cursor, 10);
  return Number.isFinite(cursor) && cursor > 0 ? cursor : null;
};

/**
 * Cat bot row "thua" (limit+1) de biet con trang sau hay khong, va xac dinh nextCursor.
 *   - rows: ket qua DB da lay limit+1 row.
 *   - getId(row): ham lay khoa cursor cua mot row (vd r => r.id).
 */
export const buildKeysetMeta = (limit, rows, getId) => {
  const hasNext = rows.length > limit;
  const pageRows = hasNext ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasNext && pageRows.length > 0 ? getId(pageRows[pageRows.length - 1]) : null;
  return {
    pageRows,
    meta: {
      limit,
      count: pageRows.length,
      nextCursor,
      hasNext,
    },
  };
};
