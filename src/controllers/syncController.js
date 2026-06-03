const { performSync } = require("../services/syncService");
const { success, error } = require("../utils/responseHelper");

// POST /sync — Q4
const syncData = async (req, res, next) => {
  try {
    const result = await performSync();

    // Exact response format as per Q4 Example Response in question paper
    return success(res, 200, "Data synced successfully", {
      totalFetched: result.totalFetched,
      inserted: result.inserted,
      duplicates: result.duplicates,
      rejected: result.rejected,
    });
  } catch (err) {
    console.error("❌ Sync error:", err.message);

    if (err.response) {
      return error(
        res,
        err.response.status || 500,
        `Sync failed: ${err.response.data?.message || err.message}`
      );
    }

    next(err);
  }
};

module.exports = { syncData };
