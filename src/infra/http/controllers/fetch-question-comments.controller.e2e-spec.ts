import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { QuestionFactory } from 'test/factories/make-question'
import { QuestionCommentFactory } from 'test/factories/make-question-comment'
import { StudentFactory } from 'test/factories/make-student'

describe('Fetch Question Comments (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let questionComments: QuestionCommentFactory
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, QuestionCommentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    questionComments = moduleRef.get(QuestionCommentFactory)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    await app.init()
  })
  test('[GET] /questions/:questionId/comments', async () => {
    const user = await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    await Promise.all([
      questionComments.makePrismaQuestionComment({
        authorId: user.id,
        questionId: question.id,
        content: 'comment 01',
      }),
      questionComments.makePrismaQuestionComment({
        authorId: user.id,
        questionId: question.id,
        content: 'comment 02',
      }),
    ])

    const questionId = question.id.toString()

    const response = await request(app.getHttpServer())
      .get(`/questions/${questionId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      questionComments: expect.arrayContaining([
        expect.objectContaining({
          content: 'comment 01',
        }),
        expect.objectContaining({
          content: 'comment 02',
        }),
      ]),
    })
  })
})
