import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { BUTTON_GLOW } from '../theme'

/** The project's standard button: accent colour, grows slightly with a soft
 *  glow on hover, shrinks on press. motion.button is a normal button that
 *  the "motion" library can animate. */
export function Button({ className = '', ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04, boxShadow: BUTTON_GLOW }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.17 }}
      className={`cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-white ${className}`}
      {...props}
    />
  )
}
