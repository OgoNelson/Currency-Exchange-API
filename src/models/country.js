const pool = require("../utils/database");

class Country {
  static async findAll(filters = {}, sortBy = null) {
    let query = "SELECT * FROM countries WHERE 1=1";
    const params = [];

    if (filters.region) {
      query += " AND region = ?";
      params.push(filters.region);
    }

    if (filters.currency) {
      query += " AND currency_code = ?";
      params.push(filters.currency);
    }

    if (sortBy) {
      switch (sortBy) {
        case "gdp_asc":
          query += " ORDER BY estimated_gdp ASC";
          break;
        case "gdp_desc":
          query += " ORDER BY estimated_gdp DESC";
          break;
        case "name_asc":
          query += " ORDER BY name ASC";
          break;
        case "name_desc":
          query += " ORDER BY name DESC";
          break;
        default:
          query += " ORDER BY name ASC";
      }
    } else {
      query += " ORDER BY name ASC";
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findByName(name) {
    const [rows] = await pool.execute(
      "SELECT * FROM countries WHERE LOWER(name) = LOWER(?)",
      [name]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM countries WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  static async create(countryData) {
    const {
      name,
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
    } = countryData;

    const [result] = await pool.execute(
      `INSERT INTO countries 
       (name, capital, region, population, currency_code, 
        exchange_rate, estimated_gdp, flag_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        capital,
        region,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url,
      ]
    );

    return result.insertId;
  }

  static async updateByName(name, countryData) {
    const {
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
    } = countryData;

    const [result] = await pool.execute(
      `UPDATE countries SET 
       capital = ?, region = ?, population = ?, 
       currency_code = ?, exchange_rate = ?, 
       estimated_gdp = ?, flag_url = ? 
       WHERE LOWER(name) = LOWER(?)`,
      [
        capital,
        region,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url,
        name,
      ]
    );

    return result.affectedRows > 0;
  }

  static async deleteByName(name) {
    const [result] = await pool.execute(
      "DELETE FROM countries WHERE LOWER(name) = LOWER(?)",
      [name]
    );
    return result.affectedRows > 0;
  }

  static async getTopCountriesByGDP(limit = 5) {
    // ensure limit is a safe integer (avoid injection)
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;

    // use string interpolation instead of parameter binding for LIMIT
    const [rows] = await pool.query(
      `SELECT * FROM countries 
     WHERE estimated_gdp IS NOT NULL 
     ORDER BY estimated_gdp DESC 
     LIMIT ${safeLimit}`
    );

    return rows;
  }

  static async count() {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as count FROM countries"
    );
    return rows[0].count;
  }

  static async updateSystemStatus(totalCountries) {
    await pool.execute(
      "UPDATE system_status SET total_countries = ?, last_refreshed_at = NOW() WHERE id = 1",
      [totalCountries]
    );
  }

  static async getSystemStatus() {
    const [rows] = await pool.execute(
      "SELECT * FROM system_status WHERE id = 1"
    );
    return rows[0];
  }
}

module.exports = Country;
