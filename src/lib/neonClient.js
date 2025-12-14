import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('VITE_NEON_DATABASE_URL is not set');
}

// Create singleton query helper
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

/**
 * Execute a SQL query with basic error logging
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(queryString, params = []) {
  if (!sql) {
    throw new Error('Neon client not initialized - missing DATABASE_URL');
  }

  try {
    const result = await sql(queryString, params);
    return result;
  } catch (error) {
    console.error('Neon query error:', {
      query: queryString,
      params,
      error: error.message,
    });
    throw error;
  }
}

export default { query };
