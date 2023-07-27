/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.post('/users', 'UsersController.store')
Route.put('/users/:id', 'UsersController.update').middleware('auth')

Route.post('/forgot-password', 'PasswordsController.forgotPassword')
Route.post('/reset-password', 'PasswordsController.resetPassword')

Route.post('/sessions', 'SessionsController.store')
Route.delete('/sessions', 'SessionsController.destroy')

Route.get('/tables', 'TablesController.index').middleware('auth')
Route.post('/tables', 'TablesController.store').middleware('auth')
Route.delete('/tables/:id', 'TablesController.destroy').middleware('auth')
Route.patch('/tables/:id', 'TablesController.update').middleware('auth')
Route.delete('/tables/:tableId/players/:playerId', 'TablesController.removePlayer').middleware(
  'auth'
)

Route.get('/tables/:tableId/requests', 'TableRequestsController.index').middleware('auth')
Route.post('/tables/:tableId/requests', 'TableRequestsController.store').middleware('auth')
Route.post(
  '/tables/:tableId/requests/:requestId/accept',
  'TableRequestsController.accept'
).middleware('auth')
Route.delete('/tables/:tableId/requests/:requestId', 'TableRequestsController.destroy').middleware(
  'auth'
)
