import React, { ChangeEvent, useState } from 'react'
import dynamic, { LoaderComponent } from 'next/dynamic'
import EditorJS, { OutputData } from '@editorjs/editorjs'
import { useSaveCallback, useLoadData, options, useSetData, dataKey } from '../components/Editor'
import MyInput from '../components/input/MyInput'
import { Article } from '../lib/ArticleTypes'
import Select from 'react-select'
import TagsPicker from '../components/TagsPicker'
import { useSession } from "next-auth/react"
import AccessDenied from '../components/AccessDenied'
import FileUpload from '../components/FileUpload'
import { GetServerSideProps, NextPage } from 'next'
import { categories } from '../lib/lib'
import checkPriveleges from "../lib/client/checkPriveleges"
import { User } from '../lib/UserTypes'
import uploadImage from '../lib/client/uploadImage'
import { useRouter } from 'next/router'
import ArticleService from '../lib/server/article/service'
import cl from "../components/input/MyInput.module.scss"
import Spinner from '../components/Spinner'

interface PageProps {
  article?: Article
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const slug = context.query.edit as string
  if (slug) {
    const article = await ArticleService.getBySlug(slug)
    return {
      props: {
        article
      }
    }
  } 
  return {
    props: {}
  } 
}

const Editor = dynamic<EditorJS>(
  () => import('../components/Editor/editor')
  .then(mod => mod.EditorContainer) as LoaderComponent<EditorJS>,
  { ssr: false }
) as any

const EditorPage: NextPage<PageProps> = (props) => {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorJS | null>(null)
  const [error, setError] = useState<string | null>(null)

  const img = props?.article?.img ?? undefined
  const edit = props.article ? true : false
  //Загрузить данные либо из пропсов при редактировании
  // либо из localStorage, в обратном случае
  const { data, loading } = edit
  ? {data: props?.article?.content, loading: false}
  // eslint-disable-next-line react-hooks/rules-of-hooks
  : useLoadData()
 
  const { data: session, status } = useSession()
  const authLoading = status === "loading"
  
  // установить загруженные [выше] данные
  useSetData(editor as EditorJS, data as OutputData)
  
  // выключаем кнопку сохранения если идёт загрузка
  const disabled = editor === null || loading || authLoading

  // устанавливаем данные о статье в начальное значение
  const [article, setArticle] = useState<Article | null | undefined>(props?.article)
  const [uploading, setUploading] = useState(false)

  //make a slug from title suitable for URL
  const getSlug = (t:string) => { 
    const filter = /[^а-яё\w-]/g //every character that not letter, digit or '-'
    return t.toLocaleLowerCase().split(' ').join('-').replace(filter, '')
  }

  const onSave = useSaveCallback(editor as EditorJS)
  const saveLogic = (data: OutputData, img_url?: string) => {
    fetch(`/api/articles/${edit ? article?.slug : ''}`, 
    {
      method: edit ? 'PUT' : 'POST',
      body: JSON.stringify(
        {
          ...article,
          img: img_url ? img_url : img ? img : undefined,
          slug: getSlug(article?.title as string),
          createdAt: article?.createdAt ?? new Date,
          editedAt: edit ? new Date : undefined,
          author: article?.author ?? session?.user?.name,
          content: data,
        },
      ),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.status <= 201) {
        localStorage.removeItem(dataKey)
        router.push(`/${article?.category}/${getSlug(article?.title as string)}`)
      }
      else {
        alert("Check your inputs. Title must be specified and unique.")
        router.reload()
      }
      setUploading(false)
    })
    .catch(error => console.log(error))
  }

  const onSubmit = () => {
    onSave().then(editorData => {
      if (
        !article?.title ||
        !article?.category ||
        !article?.description 
      ) {
        alert("some of required fields are not specified")
        return
      }
      setUploading(true)
      if (imageSrc) {
        uploadImage(file as File)
        .then(([err, data]) => {
          if (err) {
            setError(err)
            setUploading(false)
          }
          if (data) {
            saveLogic(editorData as OutputData, data.secure_url)
          }
        })
      }
      else {
        saveLogic(editorData as OutputData)
      }
    })
  }

  // ничего не выводим пока не закончится загрузка
  if (typeof window !== "undefined" && loading && authLoading) return null

  // если пользователь не авторизован, выводим компонент AccessDenied
  if (!session) {
    return <AccessDenied callbackUrl={'/editor'} />
  }

  //если поступил запрос на редактирование, но пользователь не является ни админом, ни автором
  if (edit && session && !checkPriveleges(session.user as User, article?.author as string))
    return <div>You don&apos;t have permission to edit this article</div>
  
  return (
    <div className="editor-page">
      { 
        uploading
        ? 
        <Spinner />
        :
        <main>
        <div className="inputs">
          {
            // при редактировании название статьи изменить нельзя, но отобразить надо
            edit
            ? <h1>{article?.title}</h1>
            : <MyInput 
                value={article?.title as string}
                onChange={
                  (e:ChangeEvent<HTMLInputElement>) => {
                  setArticle({...article, title: e.target.value as string} as Article)
                }}
                type="text" 
                placeholder="Title..."
                disabled={edit}
              />
          }
          <textarea
            value={article?.description}
            className={cl.myInput} 
            style={{
                marginBottom: -1,
                marginTop: -1,
                font: "inherit",
            }}
            placeholder="Description..."
            onChange={e => setArticle({...article, description: e.target.value} as Article)}
          >
          </textarea>
          <Select
            defaultValue={ edit && {value: article?.category, label: article?.category}}
            placeholder={'Category...'}
            onChange={selected => {
              const {value} = selected as { value: string, label: string}
              setArticle({...article, category: value } as Article)
            }}
            options={categories.map(item => {return {value: item, label: item}})}
          />
          <TagsPicker 
            defaultValue={ edit ? article?.tags?.map(tag => {return {value: tag, label: tag}}) : undefined}
            onChange={v => setArticle({...article, tags: v.map((val, _) => val.value)} as Article)}
          />
          <div>
            Select an image:<span className='hint'>(image will be converted to 2x1 ratio)</span>
            <div>
              <FileUpload setImageSrc={setImageSrc} setFile={setFile} />
              {
                (imageSrc || img) && <img style={{width: '100%'}} src={imageSrc ?? img} alt='preview' />
              }
              {
                error && <p>{error}</p>
              }
            </div>
          </div>
        </div>
        <div className="editorContainer">
          <Editor reInit editorRef={setEditor} options={options} data={data} />
        </div>
        <button disabled={disabled} type="button" onClick={onSubmit}>save article</button>{' '}
      </main>
      }

    </div>
  )
}

export default EditorPage