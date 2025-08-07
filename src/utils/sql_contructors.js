
const { isValidDateFormat, sanitizeIdentifier } = require('./functions');
const { ValidationError } = require('./api_error_handler');

const database = require('../../src/database');
const db = database();

function buildMySqlFilter(query, customSqlFilter = "") {
    if (typeof query !== "object" || query === null) {
      throw new ValidationError("Invalid input.", "The 'query' parameter must be an object.");
    }
  
    const filters = [];
    const validOrders = ["asc", "desc"];
  
    if (query.date_from) {
      if (!isValidDateFormat(query.date_from)) {
        throw new ValidationError("Incorrect date format.", "'date_from' must be in yyyy-mm-dd format.");
      }
      if (query.date_to) {
        if (!isValidDateFormat(query.date_to)) {
          throw new ValidationError("Incorrect date format.", "'date_to' must be in yyyy-mm-dd format.");
        }
        filters.push(`DATE(created_at) BETWEEN '${query.date_from}' AND '${query.date_to}'`);
      } else {
        filters.push(`DATE(created_at) = '${query.date_from}'`);
      }
    }
  
    if (customSqlFilter) {
      filters.unshift(customSqlFilter);
    }

    if (query.query) {
      if(query.query.length > 255){
        throw new ValidationError("Invalid query.", "'query' too long;");
      }

      filters.push(`#QUERY#`);
    }

  
    if (query.order) {
      if (!validOrders.includes(query.order.toLowerCase())) {
        throw new ValidationError("Invalid order value.", "'order' must be 'asc' or 'desc'.");
      }
      const orderBy = query.order_by || "id";
      filters.push(`ORDER BY ${sanitizeIdentifier(orderBy)} ${query.order.toUpperCase()}`);
    }

    if (query.limit) {
      const limit = parseInt(query.limit, 10);
      if (isNaN(limit) || limit < 0 || limit > 100000) {
        throw new ValidationError("Invalid limit.", "'limit' must be a positive integer less than 100.000.");
      }

      const page = parseInt(query.page, 10);
      if(query.page){
        if (isNaN(page) || page < 1 || page > 100000) {
          throw new ValidationError("Invalid page.", "'page' must be a positive integer less than 100.000.");
        }

        filters.push(`LIMIT ${(page - 1) * limit}, ${limit}`);
      }else{
        filters.push(`LIMIT ${limit}`);
      }
    }

    

    const whereClause = filters.length ? `WHERE ${filters.filter(f => !f.startsWith("ORDER BY") && !f.startsWith("LIMIT")).join(" AND ")}` : "";
    const orderClause = filters.find(f => f.startsWith("ORDER BY")) || "";
    const limitClause = filters.find(f => f.startsWith("LIMIT")) || "";
  
    return `${whereClause} ${orderClause} ${limitClause}`.trim();
}

function buildMySqlInsert(table, data) {
    let sql = `insert into ${table}(${Object.keys(data).join(", ")}) values(${Object.keys(data).map(e => { return "?" }).join(", ")})`;

    return sql;
}

function msySqlUpdateConstructor(table, id, obj){
    let sql = `update ${table} set `

    for (const [key, value] of Object.entries(obj)) {
        sql += `${key} = ?, `
    }

    sql = sql.slice(0, -2);
    sql += ` where id = ${id}`;

    return {sql: sql, values: Object.values(obj)}
}


async function checkExistence(array, by_deleted_at=true){
    for (let i = 0; i < array.length; i++) {
        const el = array[i];

        if(!el.id) continue;

        const [check] = await db.execute(`select ${by_deleted_at ? "deleted_at" : "id"} from ${el.table} where id = ${el.id}`);
        
        if(check[0]?.deleted_at || check.length < 1) throw new ValidationError(`The ${el.field} is invalid.`, `Serve and valid ${el.field}.`);
    }
}

  
module.exports = { buildMySqlFilter, buildMySqlInsert, msySqlUpdateConstructor, checkExistence };