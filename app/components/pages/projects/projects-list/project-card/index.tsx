import Image from 'next/image'

export const ProjectCard = () => {
  return (
    <div className='rounded-lg h-[436px] flex flex-col bg-gray-800 overflow-hidden border-2 border-gray-800 hover:border-emerald-500 opacity-70 hover:opacity-100 transition-all group'>
      <div className='w-full h-48 overflow-hidden'>
        <Image
          src=''
          alt='Imagem do Projeto'
          width={380}
          height={200}
          className='w-full h-full object-cover group-hover:scale-110 transition-all duration-500'
          unoptimized
        />
      </div>
      <div className='flex-1 flex flex-col p-8'>
        <strong className='font-medium text-gray-50/90 group-hover:text-emerald-500 transition-all'>
          Nome do Projeto
        </strong>
        <p className='mt-2 text-gray-400 line-clamp-4'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate
          nemo facilis tempore atque consectetur earum sequi mollitia quaerat
          similique officiis? Minus voluptatum incidunt dignissimos recusandae
          facilis vel earum consequuntur totam! Consequuntur expedita commodi
          facilis id eum illo tempora enim maxime, aut sint ipsa accusantium
        </p>
        <span className='text-gray-300 text-sm font-medium block mt-auto truncate'>
          Next.js, TypeScript, TailwindCSS, React Icons, React Hook Form, Zod,
        </span>
      </div>
    </div>
  )
}
