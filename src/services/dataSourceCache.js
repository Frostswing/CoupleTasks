/**
 * Cache for data source to prevent repeated calls to getDataSource
 */

let cache = {};

export const cacheDataSource = (userId, dataSource) => {
  cache[userId] = {
    dataSource,
    timestamp: Date.now()
  };
};

export const getCachedDataSource = (userId) => {
  const cached = cache[userId];
  
  // Cache expires after 5 minutes
  if (cached && (Date.now() - cached.timestamp) < 300000) {
    return cached.dataSource;
  }
  
  return null;
};

export const clearDataSourceCache = (userId = null) => {
  if (userId) {
    delete cache[userId];
  } else {
    cache = {};
  }
};

