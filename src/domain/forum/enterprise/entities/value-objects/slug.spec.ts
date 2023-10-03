import { Slug } from './slug'

test('create a slug from text', () => {
  const slug = Slug.createFromText('John Doe')

  expect(slug.value).toEqual('john-doe')
})
