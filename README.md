# Postgres Parameters

`pg-parameters` is a postgres client library that supports queries with named parameters.

The `pg` module supports parameterized queries, however, the queries need to be defined using ordinal parameters (`$1`, `$2`, etc.), and the parameters must be passed in as an array. The purpose of this library is enable queries to be defined and executed more intuitively using named parameters.

This library uses parameter names preceded by a colon (`:`), example: `:parameter_name`.

Explicitly named parameters:

```js
const rows = await client.query(`
  select
    key,
    value
  from key_value
  where id = :id;
`, { id: 1 });
```

Instead of:

```js
const { rows } = await client.query(`
  select
    key,
    value
  from key_value
  where id = $1;
`, [ 1 ]);
```

## Installation

Installation is done via `npm`. Example:

```
npm install --save pg-parameters
```

## Other features

Some of the other features include:

* table insertion using JavaScript objects
* return `rows`/`row` directly from `query`/`querySingle` methods
  * the existing `pg` result is available using the `execute` method
* transactions
* `typescript` definitions

## Example

```js
import { Client } from 'pg-query';

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  password: '<password>',
  database: 'postgres',
});

async function dbExample() {
  // create new table
  await client.execute(`
    create table if not exists key_value (
      id serial primary key,
      key text not null,
      value text
    );`);

  // insert new record
  const newRecord = await client.insert(`key_value`, {
    key: 'test',
    value: 'value',
  }, 'id');
  console.log('New record inserted, id:', newRecord.id);

  // select new record
  const record = await client.querySingle(`
    select
      key,
      value
    from key_value
    where id = :id;`, { id: newRecord.id });
  console.log('Record retrieved:', record);

  // select multiple records
  const records = await client.query(`
    select
      id,
      key,
      value
    from key_value
    where key = :key
    and value is not null;`, { key: 'test' });
  console.log('Records retrieved:', records);
}

dbExample().then(() => {
  process.exit();
});
```
