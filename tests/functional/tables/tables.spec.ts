import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import { TableFactory, UserFactory } from 'Database/factories'
import Table from 'App/Models/Table'

test.group('Tables', async (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('it should create a table and attach master into itself', async ({ client }) => {
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: user.id }).create()
    const { name, master } = table
    const response = await client.post('/tables').json(table).loginAs(user)
    response.assertStatus(201)
    response.assertBodyContains({ table: { name, master, players: [{ id: master }] } })
  })

  test('it should return 422 when required data is not provided', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client.post('/tables').json({}).loginAs(user)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should update a table', async ({ client }) => {
    const master = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const payload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
    }
    const response = await client.patch(`/tables/${table.id}`).json(payload).loginAs(master)
    response.assertStatus(200)
    response.assertBodyContains({ table: payload })
  })

  test('it should return 404 when invalid table is provided', async ({ client }) => {
    const master = await UserFactory.create()
    const response = await client.patch(`/tables/123`).json({}).loginAs(master)
    response.assertStatus(404)
  })

  test('it should remove user from table', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const table = await TableFactory.merge({ master: master.id }).create()
    const tableRequest = await client.post(`/tables/${table.id}/requests`).loginAs(user)
    const { id } = tableRequest.body().tableRequest
    await client.post(`/tables/${table.id}/requests/${id}/accept`).loginAs(master)

    const response = await client.delete(`/tables/${table.id}/players/${user.id}`).loginAs(master)
    response.assertStatus(200)

    await table.load('players')
    assert.isEmpty(table.players)
  })

  test('it shouldnt remove the master of the table', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = await TableFactory.merge({ master: master.id }).create()

    const table = await client.post('/tables').json(tablePayload).loginAs(master)
    const { id } = table.body().table

    const response = await client.delete(`/tables/${id}/players/${master.id}`).loginAs(master)
    response.assertStatus(400)

    const tableModel = await Table.findOrFail(id)
    await tableModel.load('players')
    assert.isNotEmpty(tableModel.players)
  })

  test('it should remove the table', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = await TableFactory.merge({ master: master.id }).create()

    const table = await client.post('/tables').json(tablePayload).loginAs(master)
    const { id } = table.body().table

    const response = await client.delete(`/tables/${id}`).loginAs(master)
    response.assertStatus(200)

    const emptyTable = await Database.query().from('tables').where('id', id)
    assert.isEmpty(emptyTable)

    const players = await Database.query().from('tables_users')
    assert.isEmpty(players)
  })

  test('it should return 404 when providing an unexisting table for deletion', async ({
    client,
  }) => {
    const master = await UserFactory.create()
    const response = await client.delete('/tables/312312').loginAs(master)

    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(404)
  })

  test('it should return all tables when no query is provided to list tables', async ({
    client,
  }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }
    const createTable = await client.post('/tables').json(tablePayload).loginAs(master)
    const table = createTable.body().table
    const { name, description, schedule, location, chronic, players } = table

    const response = await client.get('/tables').loginAs(master)

    response.assertBodyContains({
      tables: {
        data: [
          {
            name,
            description,
            schedule,
            location,
            chronic,
            players,
            masterUser: { id: master.id, username: master.username },
          },
        ],
      },
    })
    response.assertStatus(200)
  })

  test('it should return nothing when inform a wrong user id', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }
    await client.post('/tables').json(tablePayload).loginAs(master)
    const response = await client.get('/tables?user=4423').loginAs(master)
    const tableList: [] = response.body().tables.data
    assert.equal(tableList.length, 0)
    response.assertStatus(200)
  })

  test('it should return all tables by user id', async ({ client }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }
    await client.post('/tables').json(tablePayload).loginAs(master)

    const response = await client.get(`/tables?user=${master.id}`).loginAs(master)
    response.assertBodyContains({
      tables: {
        data: [
          {
            masterUser: { id: master.id, username: master.username },
          },
        ],
      },
    })
    response.assertStatus(200)
  })

  test('it should return all tables by user id and name', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }

    await client.post('/tables').json(tablePayload).loginAs(master)
    await client
      .post('/tables')
      .json({ ...tablePayload, name: '123', description: '123' })
      .loginAs(master)

    const response = await client.get(`/tables?user=${master.id}&text=es`).loginAs(master)
    const tables: [] = response.body().tables.data
    assert.equal(tables.length, 1)
    response.assertStatus(200)
  })

  test('it should return all tables by user id and description', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: '123',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }

    await client.post('/tables').json(tablePayload).loginAs(master)
    await client
      .post('/tables')
      .json({ ...tablePayload, description: '123' })
      .loginAs(master)

    const response = await client.get(`/tables?user=${master.id}&text=es`).loginAs(master)
    const tables: [] = response.body().tables.data
    assert.equal(tables.length, 1)
    response.assertStatus(200)
  })

  test('it should return all tables by name', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }

    await client.post('/tables').json(tablePayload).loginAs(master)
    await client
      .post('/tables')
      .json({ ...tablePayload, name: '123', description: '123' })
      .loginAs(master)

    const response = await client.get(`/tables?text=es`).loginAs(master)
    const tables: [] = response.body().tables.data
    assert.equal(tables.length, 1)
    response.assertStatus(200)
  })

  test('it should return all tables by description', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const tablePayload = {
      name: '123',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: master.id,
    }

    await client.post('/tables').json(tablePayload).loginAs(master)
    await client
      .post('/tables')
      .json({ ...tablePayload, description: '123' })
      .loginAs(master)

    const response = await client.get(`/tables?text=es`).loginAs(master)
    const tables: [] = response.body().tables.data
    assert.equal(tables.length, 1)
    response.assertStatus(200)
  })
})
