import { useCallback, useState, useEffect } from "react"
import initialData from './data.json'
import { useRouter } from 'next/router'
import { Article } from "../../lib/ArticleTypes"

export const useSaveCallback = (editor, initialArticle: Article, edit: boolean, uploadData) => {
  const router = useRouter()
  return useCallback(async () => {
    if (!editor) return
    try {      
      const data = await editor.save()
      console.group('EDITOR onSave')
      console.dir(data)
      localStorage.setItem(dataKey, JSON.stringify(data))
      console.info('Saved in localStorage')
      console.groupEnd()
      const img = uploadData ? uploadData.secure_url : undefined
      const article = {...initialArticle, img, content: data}
      const response = await fetch(
        `/api/articles/${edit ? article.slug : ''}`, 
      {
        method: edit ? 'PUT' : 'POST',
        body: JSON.stringify({article}),
        headers: {
            'Content-Type': 'application/json'
          }
      })
      if (response.status <= 201) {
        localStorage.removeItem(dataKey)
        router.push(`/${article.category}/${article.slug}`)
      }
      else {
        alert("Check your inputs. Title must be specified and unique.")
      }
    } 
    catch (e) {
      console.error('SAVE RESULT failed', e)
    }
  }, [editor, initialArticle, router, edit])
}

// Set editor data after initializing
export const useSetData = (editor, data) => {
  useEffect(() => {
    if (!editor || !data) {
      return
    }
    
    editor.isReady.then(() => {
      // fixing an annoying warning in Chrome `addRange(): The given range isn't in document.`
      setTimeout(() => {
        editor.render(data)
      }, 100)
    })
  }, [editor, data])
}

export const useClearDataCallback = (editor) => {
  return useCallback((ev) => {
    ev.preventDefault()
    if (!editor) {
      return
    }
    editor.isReady.then(() => {
      // fixing an annoying warning in Chrome `addRange(): The given range isn't in document.`
      setTimeout(() => {
        editor.clear()
      }, 100)
    })
  }, [editor])
}

// load saved data
export const useLoadData = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => {
      console.group('EDITOR load data')
      const saved = localStorage.getItem(dataKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setData(parsed)
        console.dir(parsed)
      } else {
        console.info('No saved data, using initial')
        console.dir(initialData)
        setData(initialData)
      }
      console.groupEnd()
      setLoading(false)
    }, 200)
    
    return () => {
      setLoading(false)
      clearTimeout(id)
    }
  }, [])
  
  return { data, loading }
}

export const dataKey = 'editorData'