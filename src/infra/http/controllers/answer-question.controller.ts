import { AnswerQuestionUseCase } from '@/domain/forum/application/use-cases/answer-question'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const answerQuestionBodySchema = z.object({
  authorId: z.string().uuid(),
  content: z.string(),
  questionId: z.string().uuid(),
})

type AnswerQuestionBodySchemaType = z.infer<typeof answerQuestionBodySchema>

const bodyValidation = new ZodValidationPipe(answerQuestionBodySchema)

@Controller('/answers')
export class AnswerQuestionController {
  constructor(private answerQuestionUseCase: AnswerQuestionUseCase) {}

  @Post()
  async handle(@Body(bodyValidation) body: AnswerQuestionBodySchemaType) {
    const { authorId, questionId, content } = body

    const result = await this.answerQuestionUseCase.execute({
      instructorId: authorId,
      questionId,
      content,
      attachmentsIds: [],
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      answer: result.value.answer,
    }
  }
}
