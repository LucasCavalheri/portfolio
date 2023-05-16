import { Link } from '@/app/components/link'
import { TechBadge } from '@/app/components/tech-badge'
import Image from 'next/image'
import { HiArrowNarrowRight } from 'react-icons/hi'

export const ProjectCard = () => {
  return (
    <div className='flex gap-6 lg:gap-12 flex-col lg:flex-row'>
      <div className='w-full h-full'>
        <Image
          src=''
          alt='Thumbnail do Projeto'
          width={420}
          height={304}
          className='w-full h-[200px] sm:h-[300px] lg:w-[420px] lg:min-h-full object-cover rounded-lg'
        />
      </div>
      <div>
        <h3 className='flex items-center gap-3 font-medium text-lg text-gray-50'>
          <Image
            src='/images/icons/project-title-icon.svg'
            alt='Ícone para enfeitar o título do projeto'
            width={20}
            height={20}
          />
          Título do Projeto
        </h3>
        <p className='text-gray-400 my-6'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Similique
          voluptas amet laboriosam ab expedita veritatis libero commodi
          mollitia. Nostrum perferendis itaque odio nulla adipisci explicabo
          consectetur. Vel eos necessitatibus ratione! Ipsum aliquid ullam
        </p>
        <div className='flex gap-x-2 gap-y-3 flex-wrap mb-8 lg:max-w-[350px]'>
          <TechBadge name='Node.js' />
        </div>
        <Link href='/projects/book-wise'>
          Ver Projeto
          <HiArrowNarrowRight />
        </Link>
      </div>
    </div>
  )
}
