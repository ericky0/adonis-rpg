import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import { UserFactory } from 'Database/factories'
import Hash from '@ioc:Adonis/Core/Hash'

test.group('User', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('it should create an user', async ({ client }) => {
    const user = {
      email: 'test@test.com',
      username: 'test',
      password: 'test',
    }

    const response = await client.post('/users').json(user)

    const { password, ...expected } = user
    response.assertStatus(201)
    response.assertBodyContains({ user: expected })
  })

  test('it should return 409 when email is already in use', async ({ client }) => {
    const { email } = await UserFactory.create()
    const response = await client.post('/users').json({
      email: email,
      username: 'test',
      password: 'test',
    })
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(409)
  })

  test('it should return 409 when username is already in use', async ({ client }) => {
    const { username } = await UserFactory.create()
    const response = await client.post('/users').json({
      email: 'test@test.com',
      username: username,
      password: 'test',
    })
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(409)
  })

  test('it should return 422 when required data is not provided', async ({ client }) => {
    const response = await client.post('/users').json({})
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should return 422 when provided email is invalid', async ({ client }) => {
    const response = await client.post('/users').json({
      email: 'test@ggg',
      username: 'erick',
      password: '21343',
    })
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should return 422 when provided password is invalid', async ({ client }) => {
    const response = await client.post('/users').json({
      email: 'test@test.com',
      username: 'erick',
      password: '1',
    })
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should update an user', async ({ client }) => {
    const user = await UserFactory.create()
    const email = 'test@test.com'
    const avatar = 'http://github.com/erickvsky.png'
    const updatedPassword = 'testing'
    const response = await client
      .put(`/users/${user.id}`)
      .json({
        password: updatedPassword,
        email,
        avatar,
      })
      .loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        id: user.id,
        email,
        avatar,
      },
    })
  })

  test('it should update the password of the user', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const password = 'test'

    const response = await client
      .put(`users/${user.id}`)
      .json({
        password: password,
        email: user.email,
        avatar: user.avatar,
      })
      .loginAs(user)
    await user.refresh()

    response.assertStatus(200)
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('it should return 422 when required data is not provided', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.put(`users/${user.id}`).json({}).loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 422 when provided password is invalid', async ({ client }) => {
    const user = await UserFactory.create()
    const password = '1'
    const response = await client
      .put(`users/${user.id}`)
      .json({
        password: password,
        email: user.email,
        username: user.username,
      })
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 422 when provided email is invalid', async ({ client }) => {
    const user = await UserFactory.create()
    const email = 'test@t'

    const response = await client
      .put(`users/${user.id}`)
      .json({
        email: email,
        password: user.password,
        username: user.username,
      })
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 422 when provided avatar is invalid', async ({ client }) => {
    const user = await UserFactory.create()
    const avatar = 'fdsgdf'

    const response = await client
      .put(`/users/${user.id}`)
      .json({
        email: user.email,
        username: user.username,
        password: user.password,
        avatar: avatar,
      })
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it should return 403 when user is not authorized to update another user', async ({
    client,
  }) => {
    const user = await UserFactory.create()
    const secondUser = await UserFactory.create()

    const response = await client
      .put(`/users/${user.id}`)
      .json({ password: user.password, avatar: user.avatar, email: user.email })
      .loginAs(secondUser)

    response.assertStatus(403)
  })
})
