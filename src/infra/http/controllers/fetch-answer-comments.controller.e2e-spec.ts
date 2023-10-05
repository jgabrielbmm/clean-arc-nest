import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AnswerFactory } from 'test/factories/make-answer'
import { AnswerCommentFactory } from 'test/factories/make-answer-comment'
import { QuestionFactory } from 'test/factories/make-question'
import { StudentFactory } from 'test/factories/make-student'

describe('Fetch Question Comments (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let answerCommentsFactory: AnswerCommentFactory
  let answerFactory: AnswerFactory
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerCommentFactory,
        AnswerFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    answerCommentsFactory = moduleRef.get(AnswerCommentFactory)
    studentFactory = moduleRef.get(StudentFactory)
    answerFactory = moduleRef.get(AnswerFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    await app.init()
  })
  test('[GET] /answers/:answersId/comments', async () => {
    const user = await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const answer = await answerFactory.makePrismaAnswer({
      questionId: question.id,
      authorId: user.id,
    })

    await Promise.all([
      answerCommentsFactory.makePrismaAnswerComment({
        authorId: user.id,
        answerId: answer.id,
        content: 'comment 01',
      }),
      answerCommentsFactory.makePrismaAnswerComment({
        authorId: user.id,
        answerId: answer.id,
        content: 'comment 02',
      }),
    ])

    const answerId = answer.id.toString()

    const response = await request(app.getHttpServer())
      .get(`/answers/${answerId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      answerComments: expect.arrayContaining([
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
