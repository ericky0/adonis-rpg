import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Table from 'App/Models/Table'
import TableRequest from 'App/Models/TableRequest'

export default class TableRequestsController {
  public async index({ request, response }: HttpContextContract) {
    const { master } = request.qs()

    if (!master) throw new BadRequestException('master query should be provided', 422)

    const tableRequests = await TableRequest.query()
      .select('id', 'tableId', 'userId', 'status')
      .preload('table', (query) => {
        query.select('name', 'master')
      })
      .preload('user', (query) => {
        query.select('username')
      })
      .whereHas('table', (query) => {
        query.where('master', Number(master))
      })
      .where('status', 'PENDING')

    return response.ok({ tableRequests })
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const userId = auth.user!.id
    const tableId = request.param('tableId') as number

    const existingTableRequest = await TableRequest.query()
      .where('tableId', tableId)
      .andWhere('userId', userId)
      .first()

    if (existingTableRequest) throw new BadRequestException('table request already exists', 409)

    const userAlreadyInTable = await Table.query()
      .where('id', tableId)
      .andWhereHas('players', (query) => {
        query.where('id', userId)
      })
      .first()
    if (userAlreadyInTable) throw new BadRequestException('user is already in table', 422)

    const tableRequest = await TableRequest.create({ userId, tableId })
    await tableRequest.refresh()
    return response.created({ tableRequest })
  }

  public async accept({ request, response, bouncer }: HttpContextContract) {
    const tableId = request.param('tableId') as number
    const requestId = request.param('requestId') as number
    const tableRequest = await TableRequest.query()
      .where('id', requestId)
      .andWhere('tableId', tableId)
      .firstOrFail()

    await tableRequest.load('table')
    await bouncer.authorize('acceptTableRequest', tableRequest)

    const updatedTableRequest = await tableRequest.merge({ status: 'ACCEPTED' }).save()

    await tableRequest.load('table')
    await tableRequest.table.related('players').attach([tableRequest.userId])
    return response.ok({ tableRequest: updatedTableRequest })
  }

  public async destroy({ request, response, bouncer }: HttpContextContract) {
    const tableId = request.param('tableId') as number
    const requestId = request.param('requestId') as number

    const tableRequest = await TableRequest.query()
      .where('id', requestId)
      .andWhere('tableId', tableId)
      .firstOrFail()

    await tableRequest.load('table')
    await bouncer.authorize('rejectTableRequest', tableRequest)
    await tableRequest.delete()
    return response.ok({})
  }
}
