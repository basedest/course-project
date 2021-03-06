import { GetServerSideProps } from 'next'
import { ParsedUrlQuery } from 'querystring'
import ArticleService from '../../lib/server/article/service'
import { categories } from '../../lib/lib'
import SmartList from '../../components/SmartList'
import { Article } from '../../lib/ArticleTypes'

interface CategoryProps {
  articles: Article[],
  category: string,
  page: number,
  searchQuery: string
}

const Category: React.FC<CategoryProps> = ({articles, category, page, searchQuery}) => {
  return (
  <>
    <h1 className="font-['Gotham_Bold'] text-3xl mt-8 text-green-600 dark:text-green-500 uppercase">{category}</h1>
    <SmartList 
      articles={articles}
      page={page}
      searchQuery={searchQuery}
    />
  </>
  )
}

export default Category

interface IParams extends ParsedUrlQuery {
  category: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { category } = context.params as IParams
  if (!categories.includes(category)) {
    return {
      notFound: true
    }
  }

  const page = context.query.page ? parseInt(context.query.page as string) : 1
  const {title} = context.query
  const searchQuery = title ? title as string : ''
  const articles = await ArticleService.get({category, title}, page)
  return {
      props: {
          articles, page, searchQuery, category
      }
  }
}

