import { PageIntroduction } from '../components/pages/projects/page-introduction'
import { ProjectsList } from '../components/pages/projects/projects-list'
import { ProjectsPageData } from '../types/page-info'
import { fetchHygraphQuery } from '../utils/fetch-hygraph-query'

export const metadata = {
  title: 'Projetos'
}

const getPageData = async (): Promise<ProjectsPageData> => {
  const query = `
    query ProjectsQuery {
      projects(orderBy: createdAt_DESC) {
        shortDescription
        slug
        title
        thumbnail {
          url
        }
        technologies {
          name
        }
      }
    }
  `

  return fetchHygraphQuery(query, 150)
}

export default async function Projects() {
  const { projects } = await getPageData()

  return (
    <>
      <PageIntroduction />
      <ProjectsList projects={projects} />
    </>
  )
}
