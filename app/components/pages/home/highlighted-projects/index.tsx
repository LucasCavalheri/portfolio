import { HorizontalDivider } from '@/app/components/divider/horizontal'
import { SectionsTitle } from '@/app/components/sections-title'
import { ProjectCard } from './project-card'
import { Link } from '@/app/components/link'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { Project } from '@/app/types/projects'

type HighlightedProjectsProps = {
  projects: Project[]
}

export const HighlightedProjects = ({ projects }: HighlightedProjectsProps) => {
  return (
    <section className='container py-16'>
      <SectionsTitle subtitle='destaques' title='Projetos em Destaque' />
      <HorizontalDivider className='mb-16' />
      <div>
        {projects?.map((project) => (
          <div key={project.slug}>
            <ProjectCard project={project} />
            <HorizontalDivider className='my-16' />
          </div>
        ))}
        <p className='flex items-center gap-1.5'>
          <span className='text-gray-400'>Se Interessou?</span>
          <Link className='inline-flex' href='/projects'>
            Ver Todos
            <HiArrowNarrowRight />
          </Link>
        </p>
      </div>
    </section>
  )
}
