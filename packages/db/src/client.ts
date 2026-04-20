import Database from 'better-sqlite3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'temix.db');
const sqlite = new Database(dbPath);

// Initialize Tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    telegramId TEXT,
    starsBalance INTEGER DEFAULT 0,
    projects TEXT,
    created_date TEXT,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    ownerId TEXT,
    status TEXT,
    created_date TEXT,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS mutation_events (
    id TEXT PRIMARY KEY,
    projectId TEXT,
    hash TEXT,
    prevHash TEXT,
    payload TEXT,
    status TEXT,
    timestamp INTEGER,
    created_date TEXT,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS canonical_state (
    id TEXT PRIMARY KEY,
    projectId TEXT,
    eventLogHead TEXT,
    fileTree TEXT,
    artifacts TEXT,
    jus TEXT,
    deploymentRecords TEXT,
    created_date TEXT,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS deployment_records (
    id TEXT PRIMARY KEY,
    projectId TEXT,
    contractAddress TEXT,
    txHash TEXT,
    network TEXT,
    timestamp INTEGER,
    starsSpent INTEGER,
    created_date TEXT,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS pipeline_contexts (
    id TEXT PRIMARY KEY,
    projectId TEXT,
    userId TEXT,
    input TEXT,
    safetyModeEnabled INTEGER,
    status TEXT,
    auditSessionId TEXT,
    issueCard TEXT,
    created_date TEXT,
    updated_date TEXT
  );
`);

function createHandler(tableName: string) {
  return {
    async list(sort?: string, limit?: number, skip?: number) {
      let query = `SELECT * FROM ${tableName}`;
      if (sort) {
        const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
        const column = sort.startsWith('-') ? sort.substring(1) : sort;
        query += ` ORDER BY ${column} ${direction}`;
      }
      if (limit) query += ` LIMIT ${limit}`;
      if (skip) query += ` OFFSET ${skip}`;
      
      const rows = sqlite.prepare(query).all();
      return rows.map(parseRow);
    },

    async filter(queryObj: any, sort?: string, limit?: number, skip?: number) {
      let sql = `SELECT * FROM ${tableName}`;
      const keys = Object.keys(queryObj);
      const values: any[] = [];
      
      if (keys.length > 0) {
        const conditions = keys.map(key => {
          values.push(queryObj[key]);
          return `${key} = ?`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (sort) {
        const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
        const column = sort.startsWith('-') ? sort.substring(1) : sort;
        sql += ` ORDER BY ${column} ${direction}`;
      }
      if (limit) sql += ` LIMIT ${limit}`;
      if (skip) sql += ` OFFSET ${skip}`;

      const rows = sqlite.prepare(sql).all(...values);
      return rows.map(parseRow);
    },

    async get(id: string) {
      const row = sqlite.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      return row ? parseRow(row) : null;
    },

    async create(data: any) {
      const id = data.id || uuidv4();
      const now = new Date().toISOString();
      const record = { 
        ...data, 
        id, 
        created_date: now, 
        updated_date: now 
      };

      const keys = Object.keys(record);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => {
        const val = record[k];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
      });

      sqlite.prepare(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      return record;
    },

    async update(id: string, data: any) {
      const now = new Date().toISOString();
      const record = { ...data, updated_date: now };
      const keys = Object.keys(record);
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => {
        const val = record[k];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
      });
      values.push(id);

      sqlite.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ?`).run(...values);
      return this.get(id);
    }
  };
}

function parseRow(row: any) {
  if (!row) return row;
  const parsed: any = { ...row };
  // Heuristic for JSON fields
  const jsonFields = ['payload', 'fileTree', 'artifacts', 'jus', 'deploymentRecords', 'projects', 'input', 'issueCard'];
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // Not JSON, keep as string
      }
    }
  }
  return parsed;
}

export const db = {
  entities: {
    User: createHandler('users'),
    Project: createHandler('projects'),
    MutationEvent: createHandler('mutation_events'),
    CanonicalState: createHandler('canonical_state'),
    DeploymentRecord: createHandler('deployment_records'),
    PipelineContext: createHandler('pipeline_contexts'),
  }
};
