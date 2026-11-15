import type { ButtonHTMLAttributes } from 'react'

/** The project's standard button: accent colour, grows slightly on hover,
 *  shrinks on press, and shows a focus ring for keyboard users. */
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-white transition duration-150 hover:scale-[1.04] hover:shadow-[0_0_24px_rgba(79,140,255,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] ${className}`}
      {...props}
    />
  )
}
