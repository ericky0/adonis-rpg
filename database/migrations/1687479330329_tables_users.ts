import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'tables_users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.primary(['user_id', 'table_id'])
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable()
      table
        .integer('table_id')
        .unsigned()
        .references('id')
        .inTable('tables')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
