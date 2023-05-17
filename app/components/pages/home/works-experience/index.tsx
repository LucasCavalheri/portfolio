import { SectionsTitle } from '@/app/components/sections-title'
import { ExperienceItem } from './experience-item'
import { WorkExperience } from '@/app/types/work-experience'

type WorksExperienceProps = {
  experiences: WorkExperience[]
}

export const WorksExperience = ({ experiences }: WorksExperienceProps) => {
  return (
    <section className='container py-16 flex gap-10 md:gap-4 lg:gap-16 flex-col md:flex-row'>
      <div className='max-w-[420px]'>
        <SectionsTitle
          subtitle='experiências'
          title='Experiências Profissionais'
        />
        <p className='text-gray-400 mt-6'>
          Infelizmente ainda não possuo nenhuma experiência profissional. Mas...
          que tal você mudar isso e me ajudar nessa parte? :D
        </p>
      </div>
      <div className='flex flex-col gap-4'>
        {experiences?.map((experience) => (
          <ExperienceItem key={experience.companyName} experience={experience} />
        ))}
      </div>
    </section>
  )
}
