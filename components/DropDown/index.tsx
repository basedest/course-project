import Link from "next/link"
import { useEffect, useRef } from "react"

interface Props {
    options: {
        label: string
        href: string
    }[]
    label: string
}

const DropDown = ({options, label}: Props) => {
    const ref = useRef(null)
    const handleClick = () => {
        ref.current.classList.toggle('show')
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                ref.current.classList.remove('show')
            }
        }
        document.addEventListener('click', handleClickOutside, true)
        return () => {
        document.removeEventListener('click', handleClickOutside, true)
        }
    })

    return (
        <div ref={ref} className='dropdown'>
        <button className='dropdown__btn' onClick={handleClick}>
            {label}
            <svg className='arrow' fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <ul className="dropdown__content">
            {
                options.map((option, _) => (
                    <li key={option.label}>
                        <Link href={option.href}>
                            <a>{option.label}</a>
                        </Link>
                    </li>
                ))
            }
        </ul>
    </div>
    )
}

export default DropDown