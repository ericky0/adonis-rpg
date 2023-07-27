import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Table from './Table'

export default class TableRequest extends BaseModel {
  public static table = 'tables_requests'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'table_id' })
  public tableId: number

  @column()
  public status: string

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Table, {
    foreignKey: 'tableId',
  })
  public table: BelongsTo<typeof Table>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
