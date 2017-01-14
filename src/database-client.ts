import QueryBuilder from './query-builder';

// tslint:disable-next-line:no-var-requires
const pg = require('pg');

export interface IPostgresOptions {
  host?: string;
  user: string;
  password: string;
  database?: string;
  port?: number;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
}

export interface IPostresQueryResponse {
  command: string;
  fields: any[];
  rowCount: number;
  rows: any[];
}

export default class DatabaseClient {
  private client: any;
  private pool: any;

  constructor(postgresOptions: IPostgresOptions) {
    this.pool = new pg.Pool(postgresOptions);
    this.withTransaction = this.withTransaction.bind(this);
  }

  /**
   * Executes the passed in function within a transaction.
   * @param fn  The actions to be executed as an atomic transaction.
   * @returns   The result of `fn()`.
   */
  public async withTransaction(fn: () => Promise<any>): Promise<any> {
    let response: any;
    let success = false;

    await this.client.execute('begin');
    try {
      response = await fn();
      success = true;
    } finally {
      if (success) {
        await this.client.execute('commit');
      } else {
        await this.client.execute('rollback');
      }
    }

    return response;
  }

  public async execute(query: string, parameters?: any): Promise<IPostresQueryResponse> {
    await this.ensureConnection();

    const queryObj = QueryBuilder.buildQuery(query, parameters);
    const result = await this.client.query(queryObj.query, queryObj.arguments);

    return result;
  }

  public async query(query: string, parameters?: any): Promise<any[]> {
    const result = await this.execute(query, parameters);
    return result.rows;
  }

  public async querySingle(query: string, parameters?: any): Promise<any> {
    const result = await this.execute(query, parameters);

    if (result.rows.length > 1) {
      throw new Error(`Expected a single result, but found ${result.rows.length}`);
    }

    return result.rows[0];
  }

  public async insert(tableName: string, fields: any, ...returning: string[]): Promise<any> {
    await this.ensureConnection();

    const queryObj = QueryBuilder.buildInsert(tableName, fields, returning);
    const result = await this.client.query(queryObj.query, queryObj.arguments);

    return result.rows[0];
  }

  private async ensureConnection() {
    if (!this.client) {
      this.client = await this.pool.connect();
    }
  }
}
