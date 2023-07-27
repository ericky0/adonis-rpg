import Mail from '@ioc:Adonis/Addons/Mail'
import Database from '@ioc:Adonis/Lucid/Database'
import Hash from '@ioc:Adonis/Core/Hash'
import { test } from '@japa/runner'
import { UserFactory } from 'Database/factories'
import { DateTime, Duration } from 'luxon'

test.group('Passwords', async (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('it should send an email with forgot password instructions', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const mailer = Mail.fake()

    await client.post('/forgot-password').json({
      email: user.email,
      resetPasswordUrl: 'url',
    })

    assert.isTrue(mailer.exists({ subject: 'Roleplay: Recuperação de Senha' }))
    assert.isTrue(mailer.exists({ to: [{ address: user.email }] }))
    assert.isTrue(mailer.exists({ from: { address: 'no-reply@roleplay.com' } }))
    assert.isTrue(mailer.exists((mail) => mail.html!.includes(user.username)))

    Mail.restore()
  })

  test('it should create a reset password token', async ({ client, assert }) => {
    Mail.fake()
    const user = await UserFactory.create()

    const response = await client.post('/forgot-password').json({
      email: user.email,
      resetPasswordUrl: 'url',
    })
    const tokens = await user.related('tokens').query()
    assert.isNotEmpty(tokens)
    response.assertStatus(204)

    Mail.restore()
  })

  test('it should return 422 when required data is not provided or invalid', async ({ client }) => {
    const response = await client.post('/forgot-password').json({})

    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should be able to reset password', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'randomtoken' })

    const response = await client.post('/reset-password').json({ token: token, password: '123456' })
    await user.refresh()
    const checkPassword = await Hash.verify(user.password, '123456')
    assert.isTrue(checkPassword)
    response.assertStatus(204)
  })

  test('it should return 422 when required data is not provided or invalid', async ({ client }) => {
    const response = await client.post('/reset-password').json({})
    response.assertBodyContains({ code: 'BAD_REQUEST' })
    response.assertStatus(422)
  })

  test('it should return 404 when using the same token twice', async ({ client }) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'randomtoken' })

    const firstResponse = await client
      .post('/reset-password')
      .json({ token: token, password: '123456' })
    firstResponse.assertStatus(204)

    const secondResponse = await client
      .post('/reset-password')
      .json({ token: token, password: '123456' })
    secondResponse.assertStatus(404)
    secondResponse.assertBodyContains({ code: 'BAD_REQUEST' })
  })

  test('it cannot reset password when token is expired after 2 hours', async ({ client }) => {
    const user = await UserFactory.create()
    const date = DateTime.now().minus(Duration.fromISOTime('02:01'))

    const { token } = await user.related('tokens').create({ token: 'randomtoken', createdAt: date })
    const response = await client.post('/reset-password').json({ token: token, password: '123456' })

    response.assertBodyContains({ code: 'TOKEN_EXPIRED', message: 'token has expired' })
    response.assertStatus(410)
  })
})
