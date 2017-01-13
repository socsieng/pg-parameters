import * as chai from 'chai';
import QueryBuilder from './query-builder';

const expect = chai.expect;

describe('QueryBuilder', () => {
  describe('buildQuery', () => {
    it('should not modify query without parameters', () => {
      const result = QueryBuilder.buildQuery('select 1');
      expect(result.query).to.equal('select 1');
    });

    it('should modify query with single parameter', () => {
      const result = QueryBuilder.buildQuery('select :hello', { hello: 1 });
      expect(result.query).to.equal('select $1');
      expect(result.arguments.length).to.eq(1);
      expect(result.arguments[0]).to.eq(1);
    });

    it('should modify query with single parameter with explicit type', () => {
      const result = QueryBuilder.buildQuery('select :hello', { 'hello:text': 1 });
      expect(result.query).to.equal('select $1::text');
      expect(result.arguments.length).to.eq(1);
      expect(result.arguments[0]).to.eq(1);
    });

    it('should modify query with multiple parameters', () => {
      const result = QueryBuilder.buildQuery('select :hi, :world', { hi: 'there', world: true });
      expect(result.query).to.equal('select $1, $2');
      expect(result.arguments.length).to.eq(2);
      expect(result.arguments[0]).to.eq('there');
      expect(result.arguments[1]).to.eq(true);
    });

    it('should modify query with null parameter', () => {
      const result = QueryBuilder.buildQuery('select :hi', { hi: null });
      expect(result.query).to.equal('select $1');
      expect(result.arguments.length).to.eq(1);
      expect(result.arguments[0]).to.eq(null);
    });

    it('should modify query with multiple parameters including unmatched parameters', () => {
      const result = QueryBuilder.buildQuery('select :hi2, :world', { p: 'unmatched', hi2: 1, world: true });
      expect(result.query).to.equal('select $1, $2');
      expect(result.arguments.length).to.eq(2);
      expect(result.arguments[0]).to.eq(1);
      expect(result.arguments[1]).to.eq(true);
    });

    it('should modify query with parameter names that contain other parameter names', () => {
      const result = QueryBuilder.buildQuery('select :hi, :hi2', { hi: 'world', hi2: 'world' });
      expect(result.query).to.equal('select $1, $2');
      expect(result.arguments.length).to.eq(2);
      expect(result.arguments[0]).to.eq('world');
      expect(result.arguments[1]).to.eq('world');
    });

    it('should throw with bad parameter name', () => {
      expect(() => QueryBuilder.buildQuery('select 1', { 'not-good': 'bad' }))
        .throws(/Parameter name is invalid/);
    });

    it('should not replace unmatched parameter', () => {
      const result = QueryBuilder.buildQuery('select :exists, :not_exists', { 'exists': 'good' });
      expect(result.query).to.equal('select $1, :not_exists');
      expect(result.arguments.length).to.eq(1);
      expect(result.arguments[0]).to.eq('good');
    });
  });

  describe('buildInsert', () => {
    it('should construct query with single field', () => {
      const result = QueryBuilder.buildInsert('table', { id: 1 });
      expect(result.query).to.equal('insert into "table" ("id") values ($1)');
    });

    it('should construct query with quoted table name', () => {
      const result = QueryBuilder.buildInsert('"table"', { id: 1 });
      expect(result.query).to.equal('insert into "table" ("id") values ($1)');
    });

    it('should construct query with schema table name', () => {
      const result = QueryBuilder.buildInsert('schema.table', { id: 1 });
      expect(result.query).to.equal('insert into "schema"."table" ("id") values ($1)');
    });

    it('should construct query with multiple fields', () => {
      const result = QueryBuilder.buildInsert('table', { id: 1, value: 'hello' });
      expect(result.query).to.equal('insert into "table" ("id", "value") values ($1, $2)');
    });

    it('should construct query with multiple fields, returning single field', () => {
      const result = QueryBuilder.buildInsert('table', { id: 1, value: 'hello' }, ['id']);
      // tslint:disable-next-line:max-line-length
      expect(result.query).to.equal('insert into "table" ("id", "value") values ($1, $2) returning "id"');
    });

    it('should construct query with multiple fields, returning multiple fields', () => {
      const result = QueryBuilder.buildInsert('table', { id: 1, value: 'hello' }, ['id', 'value']);
      // tslint:disable-next-line:max-line-length
      expect(result.query).to.equal('insert into "table" ("id", "value") values ($1, $2) returning "id", "value"');
    });

    it('should construct query with multiple fields, returning multiple fields with explicit type', () => {
      const result = QueryBuilder.buildInsert('table', { 'id:text': 1, value: 'hello' }, ['id', 'value']);
      // tslint:disable-next-line:max-line-length
      expect(result.query).to.equal('insert into "table" ("id", "value") values ($1::text, $2) returning "id", "value"');
    });
  });
});
