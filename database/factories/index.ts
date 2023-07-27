import Factory from '@ioc:Adonis/Lucid/Factory'
import Table from 'App/Models/Table'
import User from 'App/Models/User'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    username: faker.person.firstName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    avatar: faker.internet.url(),
  }
}).build()

export const TableFactory = Factory.define(Table, ({ faker }) => {
  return {
    name: faker.person.firstName(),
    description: faker.lorem.paragraph(),
    schedule: faker.date.weekday(),
    location: faker.internet.url(),
    chronic: faker.lorem.sentence(),
  }
}).build()
