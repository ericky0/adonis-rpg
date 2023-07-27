import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import TableRequest from 'App/Models/TableRequest'
import { TableFactory, UserFactory } from 'Database/factories'

test.group('Table Request', async (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('it should create a table request', async ({ client }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const response = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    response.assertStatus(201)
    response.assertBodyContains({ tableRequest: { table_id: table.id, user_id: user.id } })
  })

  test('it should return 409 (conflict) when table request already exists', async ({ client }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const response = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    response.assertStatus(201)

    const secondResponse = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    secondResponse.assertStatus(409)
    secondResponse.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 422 when user is already in the table', async ({ client }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    // we do this because we just insert master into table when we call the api, this is not possible creating a fake table
    const dbTable = await client.post('/tables').json(table).loginAs(master)
    const response = await client
      .post(`/tables/${dbTable.body().table.id}/requests`)
      .loginAs(master)
    response.assertStatus(422)
  })

  test('it should list group requests by master', async ({ client }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    const tableRequest = await client.post(`/tables/${table.id}/requests`).loginAs(user)

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, user_id, table_id, status } = tableRequest.body().tableRequest

    const listTableRequests = await client
      .get(`/tables/${table.id}/requests?master=${master.id}`)
      .loginAs(master)
    listTableRequests.assertBodyContains({ tableRequests: [{ id, user_id, table_id, status }] })
    listTableRequests.assertStatus(200)
  })

  test('it should return an empty list when master has no table requests', async ({ client }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const listTableRequests = await client
      .get(`/tables/${table.id}/requests?master=${master.id}`)
      .loginAs(master)

    listTableRequests.assertBodyContains({ undefined })
  })

  test('it should 422 when master is not provided (in query)', async ({ client }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const listTableRequests = await client.get(`/tables/${table.id}/requests`).loginAs(master)
    listTableRequests.assertBodyContains({ code: 'BAD_REQUEST' })
    listTableRequests.assertStatus(422)
  })

  test('it should accept a table request', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    const tableRequest = await client.post(`/tables/${table.id}/requests`).loginAs(user)

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, user_id, table_id } = tableRequest.body().tableRequest

    const response = await client.post(`/tables/${table.id}/requests/${id}/accept`).loginAs(master)
    response.assertBodyContains({
      tableRequest: { id, user_id, table_id, status: 'ACCEPTED' },
    })
    response.assertStatus(200)

    await table.load('players')
    assert.equal(table.players[0].id, user.id)
  })

  test('it should return 404 when providing a unexisting table for accept', async ({ client }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    const tableRequest = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id } = tableRequest.body().tableRequest

    const response = await client.post(`/tables/123/requests/${id}/accept`).loginAs(master)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(404)
  })

  test('it should return 404 when providing a unexisting table request for accept', async ({
    client,
  }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    const response = await client.post(`/tables/${table.id}/requests/123/accept`).loginAs(master)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(404)
  })

  test('it should reject a table request', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const tableRequest = await client.post(`/tables/${table.id}/requests/`).loginAs(user)
    const { id } = tableRequest.body().tableRequest

    const response = await client.delete(`/tables/${table.id}/requests/${id}`).loginAs(master)
    response.assertStatus(200)

    const tableRequestExists = await TableRequest.find(id)
    assert.isNull(tableRequestExists)
  })

  test('it should return 404 when providing an unexisting table for reject', async ({ client }) => {
    const user = await UserFactory.create()
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const tableRequest = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    const { id } = tableRequest.body().tableRequest

    const response = await client.delete(`/tables/123/requests/${id}`).loginAs(master)
    response.assertStatus(404)
  })

  test('it should return 404 when providing a unexisting table request for reject', async ({
    client,
  }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()

    const response = await client.delete(`/tables/${table.id}/requests/123`).loginAs(master)
    response.assertStatus(404)
  })
})
