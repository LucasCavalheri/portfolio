'use client'

import { Button } from '@/app/components/button'
import { TechBadge } from '@/app/components/tech-badge'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { TbBrandGithub, TbBrandLinkedin, TbBrandWhatsapp } from 'react-icons/tb'
import Image from 'next/image'

const CONTACTS = [
  {
    url: 'https://github.com/LucasCavalheri',
    icon: <TbBrandGithub />
  },
  {
    url: 'https://linkedin.com/in/lucas-cavalheri',
    icon: <TbBrandLinkedin />
  },
  {
    url: 'https://whatsapp.com',
    icon: <TbBrandWhatsapp />
  }
]

export const HeroSection = () => {
  const handleContact = () => {
    const contactSection = document.querySelector('#contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className='w-full lg:h-[755px] bg-hero-image bg-cover bg-center bg-no-repeat flex flex-col justify-end pb-10 sm:pb-32 py-32 lg:pb-[110px]'>
      <div className='container flex items-start justify-between flex-col-reverse lg:flex-row'>
        <div className='w-full lg:max-w-[530px]'>
          <p className='font-mono text-emerald-400'>Olá, meu nome é</p>
          <h2 className='text-4xl font-medium mt-2'>Lucas Cavalheri</h2>
          <p className='text-gray-400 my-6 text-sm sm:text-base'>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum
            cupiditate possimus nisi voluptatibus praesentium officia hic ex
            ducimus. Quam cupiditate cum possimus! Accusantium rem ea maiores
            amet obcaecati, quod necessitatibus? Distinctio, quibusdam dolor
            optio corrupti blanditiis deleniti natus maiores eos! Corporis
            deleniti consequatur maiores earum distinctio nisi porro, ipsum
            neque, quaerat expedita quas fugiat, beatae incidunt aut libero quos
            veritatis!
          </p>
          <div className='flex flex-wrap gap-x-2 gap-y-3 lg:max-w-[340px]'>
            {Array.from({ length: 7 }).map((_, index) => (
              <TechBadge name='Next.js' />
            ))}
          </div>
          <div className='mt-6 lg:mt-10 flex sm:items-center sm:gap-5 flex-col sm:flex-row'>
            <Button onClick={handleContact} className='w-max shadow-button'>
              Entre em Contato
              <HiArrowNarrowRight size={18} />
            </Button>
            <div className='text-gray-600 text-2xl flex items-center h-20 gap-3'>
              {CONTACTS.map((contact, index) => (
                <a
                  key={`contact-${index}`}
                  href={contact.url}
                  target='_blank'
                  className='hover:text-gray-100 transition-all'
                >
                  {contact.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        <Image
          width={420}
          height={404}
          src=''
          alt='Foto de Perfil do Lucas Cavalheri'
          className='w-[300px] h-[300px] lg:w-[420px] lg:h-[404px] mb-6 lg:mb-0 shadow-2xl rounded-lg object-cover'
        />
      </div>
    </section>
  )
}
