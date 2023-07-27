import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import { UserFactory } from 'Database/factories'

test.group('Session', async (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('it should authenticate an user', async ({ client, assert }) => {
    const plainPassword = 'test'
    const { email, id } = await UserFactory.merge({
      password: plainPassword,
    }).create()
    const response = await client.post('/sessions').json({ email, password: plainPassword })
    assert.isDefined(response.body().user, 'user undefined')
    assert.equal(response.body().user.id, id)
    response.assertStatus(201)
  })

  test('it should return an api token when session is created', async ({ client, assert }) => {
    const plainPassword = 'test'
    const { email, id } = await UserFactory.merge({ password: plainPassword }).create()
    const response = await client.post('/sessions').json({ email, password: plainPassword })
    assert.isDefined(response.body().token, 'token undefined')
    assert.equal(response.body().user.id, id)
    response.assertStatus(201)
  })

  test('it should return 400 when credentials are not provided', async ({ client }) => {
    const response = await client.post('/sessions').json({})
    response.assertStatus(400)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 400 when credentials are invalid', async ({ client }) => {
    const { email } = await UserFactory.create()
    const response = await client.post('/sessions').json({ email, password: 'test' })

    response.assertStatus(400)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 200 when user signs out', async ({ client }) => {
    const plainPassword = 'test'
    const user = await UserFactory.merge({ password: plainPassword }).create()

    const response = await client
      .post('/sessions')
      .json({ email: user.email, password: plainPassword })
    response.assertStatus(201)
    const apiToken = response.body().token

    const secondResponse = await client.delete('/sessions').bearerToken(apiToken)
    secondResponse.assertStatus(200)
  })

  test('it should revoke token when user signs out', async ({ client, assert }) => {
    const plainPassword = 'test'
    const { email } = await UserFactory.merge({ password: plainPassword }).create()

    const response = await client.post('/sessions').json({ email, password: plainPassword })
    response.assertStatus(201)
    const apiToken = response.body().token

    const secondResponse = await client.delete('/sessions').bearerToken(apiToken.token)
    secondResponse.assertStatus(200)

    const token = await Database.query().select('*').from('api_tokens')

    assert.isEmpty(token)
  })
})
