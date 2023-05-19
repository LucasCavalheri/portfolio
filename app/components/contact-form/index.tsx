'use client'

import { HiArrowNarrowRight } from 'react-icons/hi'
import { Button } from '../button'
import { SectionsTitle } from '../sections-title'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import axios from 'axios'
import { fadeUpAnimation } from '@/app/lib/animations'

export const ContactForm = () => {
  const contactFormSchema = z.object({
    name: z.string().min(3).max(100),
    email: z.string().email(),
    message: z.string().min(1).max(500)
  })

  type ContactFormData = z.infer<typeof contactFormSchema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema)
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      await axios.post('/api/contact', data)
      toast.success('Mensagem enviada com sucesso')
      reset()
    } catch (_error) {
      toast.error('Erro ao enviar a mensagem, tente novamente')
    }
  }

  return (
    <section
      id='contact'
      className='py-16 px-6 md:py-32 flex items-center justify-center bg-gray-950'
    >
      <div className='w-full max-w-[420px] mx-auto'>
        <SectionsTitle
          subtitle='contato'
          title='Vamos trabalhar juntos? Entre em contato'
          className='items-center text-center'
        />
        <motion.form
          className='mt-12 w-full flex flex-col gap-4'
          onSubmit={handleSubmit(onSubmit)}
          {...fadeUpAnimation}
        >
          <input
            autoComplete='off'
            type='text'
            placeholder='Nome'
            className='w-full h-14 bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-emerald-600 transition-all'
            {...register('name')}
          />
          <input
            autoComplete='off'
            type='email'
            placeholder='E-mail'
            className='w-full h-14 bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-emerald-600 transition-all'
            {...register('email')}
          />
          <textarea
            autoComplete='off'
            placeholder='Mensagem...'
            className='resize-none w-full h-[138px] bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-emerald-600 transition-all'
            maxLength={500}
            {...register('message')}
          />
          <Button
            disabled={isSubmitting}
            className='mt-6 w-max mx-auto shadow-button'
          >
            Enviar Mensagem
            <HiArrowNarrowRight size={18} />
          </Button>
        </motion.form>
      </div>
    </section>
  )
}
