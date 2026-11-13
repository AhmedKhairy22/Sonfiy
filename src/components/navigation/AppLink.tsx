import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { IS_ARTIFACT } from '../../app/target'

/**
 * Internal navigation that works everywhere.
 * On a normal website these are real links. Inside a Claude artifact the host opens every
 * link click as an outside website, so there they are buttons that change the page in place.
 */
interface Props { to: string; className?: string; children: ReactNode; 'aria-label'?: string }

export function AppLink({ to, className, children, ...rest }: Props) {
  const navigate = useNavigate()
  if (!IS_ARTIFACT) return <Link to={to} className={className} {...rest}>{children}</Link>
  return (
    <button type="button" onClick={() => navigate(to)} className={`cursor-pointer text-left ${className ?? ''}`} {...rest}>
      {children}
    </button>
  )
}

export function AppNavLink({ to, className, children, ...rest }: Omit<Props, 'className'> & { className: (s: { isActive: boolean }) => string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (!IS_ARTIFACT) return <NavLink to={to} className={className} {...rest}>{children}</NavLink>
  const isActive = pathname === to
  return (
    <button type="button" onClick={() => navigate(to)} aria-current={isActive ? 'page' : undefined} className={`cursor-pointer ${className({ isActive })}`} {...rest}>
      {children}
    </button>
  )
}
