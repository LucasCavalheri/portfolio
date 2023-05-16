import { Button } from '@/app/components/button'
import { SectionsTitle } from '@/app/components/sections-title'
import { TechBadge } from '@/app/components/tech-badge'
import { TbBrandGithub } from 'react-icons/tb'
import { FiGlobe } from 'react-icons/fi'
import { Link } from '@/app/components/link'
import { HiArrowNarrowLeft } from 'react-icons/hi'

export const ProjectDetails = () => {
  return (
    <section className='w-full sm:min-h-[750px] flex flex-col items-center justify-end relative pb-10 sm:pb-24 py-24 px-6 overflow-hidden'>
      <div
        className='absolute inset-0 z-[-1]'
        style={{
          background:
            'url(/images/hero-bg.png) no-repeat center/cover, url(https://media.graphassets.com/7Kic5YHkQcmGrN57MSXw) no-repeat center/cover'
        }}
      />
      <SectionsTitle
        subtitle='projetos'
        title='NomeDoProjeto'
        className='text-center items-center sm:[&>h3]:text-4xl'
      />
      <p className='text-gray-400 text-center max-w-[640px] my-4 sm:my-6 text-sm sm:text-base'>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus eius
        in nesciunt mollitia numquam, quae sit! Nostrum unde sapiente officiis
        rem rerum consequatur itaque accusamus beatae facilis, ipsum velit. Et.
      </p>
      <div className='w-full max-w-[330px] flex flex-wrap gap-2 items-center justify-center'>
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
        <TechBadge name='Node.js' />
      </div>
      <div className='my-6 sm:my-12 flex items-center gap-2 sm:gap-4 flex-col sm:flex-row'>
        <a href='https://github.com/LucasCavalheri' target='_blank'>
          <Button className='min-w-[180px]'>
            <TbBrandGithub size={20} />
            Repositório
          </Button>
        </a>
        <a href='https://github.com/LucasCavalheri' target='_blank'>
          <Button className='min-w-[180px]'>
            <FiGlobe size={20} />
            Projeto Online
          </Button>
        </a>
      </div>
      <Link href='/projects'>
        <HiArrowNarrowLeft size={20} />
        Voltar para Projetos
      </Link>
    </section>
  )
}
