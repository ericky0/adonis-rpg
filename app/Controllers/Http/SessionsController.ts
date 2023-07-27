import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SessionsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])
    const token = await auth.use('api').attempt(email, password, {
      expiresIn: '2hours',
    })
    response.status(201)
    return {
      user: auth.user,
      token: token,
    }
  }

  public async destroy({ auth, response }: HttpContextContract) {
    await auth.logout()
    response.status(200)
    return {}
  }
}
