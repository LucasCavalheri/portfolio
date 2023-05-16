import { Link } from '@/app/components/link'
import { SectionsTitle } from '@/app/components/sections-title'
import { HiArrowNarrowLeft } from 'react-icons/hi'
import { ProjectList } from '../projects-list'

export const PageIntroduction = () => {
  return (
    <section className='w-full h-[450px] lg:h-[630px] bg-hero-image bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-2'>
      <SectionsTitle
        subtitle='projetos'
        title='Meus Projetos'
        className='text-center items-center [&>h3]:text-4xl'
      />
      <div className='flex flex-col items-center'>
        <p className='text-gray-400 text-center max-w-[640px] my-6 text-sm sm:text-base'>
          Aqui você poderá ver alguns dos trabalhos que eu desenvolvi. Navegue à
          vontade e explore os projetos para ver como foram criados, as
          tecnologias utilizadas e as funcionalidades implementadas.
        </p>
        <Link href='/'>
          <HiArrowNarrowLeft size={20} />
          Voltar para a Home
        </Link>
      </div>
      <ProjectList />
    </section>
  )
}
