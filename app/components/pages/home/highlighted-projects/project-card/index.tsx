'use client'

import Image from 'next/image'
import { Link } from '@/app/components/link'
import { TechBadge } from '@/app/components/tech-badge'
import { Project } from '@/app/types/projects'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { Button } from '@/app/components/button'
import { motion } from 'framer-motion'
import { fadeUpAnimation, techBadgeAnimation } from '@/app/lib/animations'

type ProjectCardProps = {
  project: Project
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <motion.div
      className='flex gap-6 lg:gap-12 flex-col lg:flex-row'
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className='w-full h-[200px] sm:h-[300px] lg:w-[420px] lg:min-h-full'
        initial={{ opacity: 0, y: 100, scale: 0.5 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.5 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Link href={`/projects/${project.slug}`}>
          <Image
            src={project.thumbnail.url}
            alt={`Thumbnail do Projeto ${project.title}`}
            width={420}
            height={304}
            className='w-full h-full object-cover rounded-lg'
          />
        </Link>
      </motion.div>
      <div className='flex-1 lg:py-[18px]'>
        <motion.h3
          className='flex items-center gap-3 font-medium text-lg text-gray-50'
          {...fadeUpAnimation}
          transition={{ duraion: 0.7 }}
        >
          <Link href={`/projects/${project.slug}`}>
            <Image
              src='/images/icons/project-title-icon.svg'
              alt='Ícone para enfeitar o título do projeto'
              width={20}
              height={20}
            />
            {project.title}
          </Link>
        </motion.h3>
        <motion.p
          className='text-gray-400 my-6'
          {...fadeUpAnimation}
          transition={{ duraion: 0.2, delay: 0.3 }}
        >
          {project.shortDescription}
        </motion.p>
        <div className='flex gap-x-2 gap-y-3 flex-wrap mb-8 lg:max-w-[350px]'>
          {project.technologies.map((tech, i) => (
            <TechBadge
              key={`${project.title}-tech-${tech.name}`}
              name={tech.name}
              {...techBadgeAnimation}
              transition={{ duration: 0.2, delay: 0.5 + i * 0.2 }}
            />
          ))}
        </div>
        <Link href={`/projects/${project.slug}`}>
          <Button className='w-max shadow-button'>
            Ver Projeto <HiArrowNarrowRight />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
