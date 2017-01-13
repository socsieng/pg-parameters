const ValidParameterNameExpression = /^(\w+):?(\w*)$/;
const ParameterExpression = /:(\w+):?(\w*)\$/g;

export interface IQuery {
  query: string;
  arguments: any[];
}

export default class QueryBuilder {
  public static buildQuery(query: string, parameters?: any): IQuery {
    let newQuery = query;
    let parameterArray: any[] = [];

    if (parameters) {
      const parameterDetails = Object.keys(parameters).map((k, index) => {
        const match = ValidParameterNameExpression.exec(k);
        if (!match) {
          throw new Error(`Parameter name is invalid: ${k}`);
        }

        const [key, type] = match.slice(1);
        const value = parameters[k];

        return {
          name: key,
          value,
          type: type ? `::${type}` : '',
          expression: new RegExp(`:${key}(?!\\w)`, 'g'),
        };
      }).filter((p) => p.expression.test(query));

      newQuery = parameterDetails.reduce(
        (q, p, index) => q.replace(p.expression, `$$${index + 1}${p.type}`),
        query,
      );
      parameterArray = parameterDetails.map((p) => p.value);
    }

    return {
      query: newQuery,
      arguments: parameterArray,
    };
  }

  public static buildInsert(tableName: string, fields: any, returning: string[] = []): IQuery {
    const fieldNames = Object.keys(fields).map((f) => f.replace(ValidParameterNameExpression, '$1'));
    const table = tableName.split('.')
      .filter((s) => s)
      .map((s) => `"${s}"`.replace(/""/g, '"'))
      .join('.');

    // tslint:disable-next-line:max-line-length
    let query = `insert into ${table} (${fieldNames.map((f) => '"' + f + '"').join(', ')}) values (${fieldNames.map((f) => ':' + f + '').join(', ')})`;

    if (returning !== null && returning.length) {
      query += ` returning ${returning.map((f) => '"' + f + '"').join(', ')}`;
    }

    return QueryBuilder.buildQuery(query, fields);
  }
}
