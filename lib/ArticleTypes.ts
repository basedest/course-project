import { OutputData } from '@editorjs/editorjs'
import { Schema, model, models, Types } from 'mongoose'

//описание типа статьи
export interface Article {
    slug: string
    title: string
    description: string
    category: string
    author: string
    createdAt: Date
    editedAt?: Date
    img?: string
    tags?: Array<string>
    content?: OutputData
    _id?: Types.ObjectId
}

//схема для БД
const ArticleSchema = new Schema<Article>({
    slug: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    img: String,
    tags: [String],
    content: Object,
    editedAt: Date
})

//экспортируем модель данных
export const ArticleModel = models.Article || model<Article>('Article', ArticleSchema)