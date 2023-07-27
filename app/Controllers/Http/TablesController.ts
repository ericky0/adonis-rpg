import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Table from 'App/Models/Table'
import CreateTableValidator from 'App/Validators/CreateTableValidator'

export default class TablesController {
  public async index({ request, response }: HttpContextContract) {
    const { text, ['user']: userId } = request.qs()

    const page = request.input('page', 1)
    const limit = request.input('limit', 5)
    const tablesQuery = this.filterByQueryString(userId, text)
    const tables = await tablesQuery.paginate(page, limit)
    return response.ok({ tables })
  }

  public async store({ request, response }: HttpContextContract) {
    const tablePayload = await request.validate(CreateTableValidator)
    const table = await Table.create(tablePayload)

    await table.related('players').attach([tablePayload.master])
    await table.load('players')
    return response.created({ table })
  }

  public async update({ request, response, bouncer }: HttpContextContract) {
    const id = request.param('id') as number
    const payload = request.all()

    const table = await Table.findOrFail(id)
    await bouncer.authorize('updateTable', table)

    const updatedTable = await table.merge(payload).save()

    return response.ok({ table: updatedTable })
  }

  public async removePlayer({ request, response }: HttpContextContract) {
    const tableId = request.param('tableId') as number
    const playerId = +request.param('playerId')

    const table = await Table.findOrFail(tableId)

    if (playerId === table.master) {
      throw new BadRequestException('cannot remove master from group', 400)
    }
    await table.related('players').detach([playerId])

    return response.ok({})
  }

  public async destroy({ request, response, bouncer }: HttpContextContract) {
    const id = request.param('id')
    const table = await Table.findOrFail(id)
    await bouncer.authorize('deleteTable', table)
    await table.delete()

    return response.ok({})
  }

  private filterByQueryString(userId: number, text: string) {
    if (userId && text) return this.filterByUserAndText(userId, text)
    else if (userId) return this.filterByUser(userId)
    else if (text) return this.filterByText(text)
    else return this.all()
  }

  private all() {
    return Table.query().preload('players').preload('masterUser')
  }

  private filterByUser(userId: number) {
    return Table.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withPlayer(userId))
  }

  private filterByText(text: string) {
    return Table.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withText(text))
  }

  private filterByUserAndText(userId: number, text: string) {
    return Table.query()
      .preload('players')
      .preload('masterUser')
      .withScopes((scope) => scope.withPlayer(userId))
      .withScopes((scope) => scope.withText(text))
  }
}
