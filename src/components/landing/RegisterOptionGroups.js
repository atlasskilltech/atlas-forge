'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'
import { SCHOOLS } from '@/config/registration'

/**
 * Choice controls for the registration form, drawn in the landing `forge-`
 * palette to match the reference frames:
 *
 *   - CheckboxGroup — square, multi-select (Dev Notes: "Checkbox = multi-select").
 *   - RadioGroup    — circle, single-select (Dev Notes: "Radio = single-select").
 *   - SchoolPicker  — the four brand-coloured ISDI / ISME / uGDX / LAW tiles.
 *
 * Each group is a real `<fieldset>`/`<legend>` so a screen reader announces the
 * question with its options, and every control is a native `<input>` so keyboard
 * and assistive tech work without custom key handling.
 */

const LEGEND =
  'text-[11px] leading-none font-bold tracking-[0.09em] text-[#1a1850] uppercase'

const OPTION_ROW = 'flex cursor-pointer items-start gap-2.5 text-[14px] text-forge-ink'

const CHECKBOX = cn(
  'mt-0.5 size-[18px] shrink-0 appearance-none rounded-[4px] border border-[#c9c7e0] bg-white',
  'cursor-pointer transition-colors checked:border-forge-purple checked:bg-forge-purple',
  'relative checked:after:absolute checked:after:left-[5px] checked:after:top-[1px]',
  'checked:after:h-[9px] checked:after:w-[5px] checked:after:rotate-45',
  'checked:after:border-b-2 checked:after:border-r-2 checked:after:border-white checked:after:content-[""]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-purple'
)

const RADIO = cn(
  'mt-0.5 size-[18px] shrink-0 appearance-none rounded-full border border-[#c9c7e0] bg-white',
  'cursor-pointer transition-colors checked:border-forge-purple',
  'relative checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:size-[9px]',
  'checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:rounded-full',
  'checked:after:bg-forge-purple checked:after:content-[""]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-purple'
)

function RequiredMark() {
  return <span className="font-normal text-forge-pink">*</span>
}

function GroupError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-2 text-xs font-medium text-forge-pink">
      {message}
    </p>
  )
}

export function CheckboxGroup({ label, name, options, values = [], onChange, error }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  const toggle = (value) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

  return (
    <fieldset aria-describedby={errorId}>
      <legend className={LEGEND}>{label}</legend>
      <div className="mt-3 flex flex-col gap-2.5">
        {options.map((option) => (
          <label key={option.value} className={OPTION_ROW}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={values.includes(option.value)}
              onChange={() => toggle(option.value)}
              className={CHECKBOX}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <GroupError id={errorId} message={error} />
    </fieldset>
  )
}

export function RadioGroup({ label, name, options, value = '', onChange, error, required }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  return (
    <fieldset aria-describedby={errorId}>
      <legend className={LEGEND}>
        {label} {required ? <RequiredMark /> : null}
      </legend>
      <div className="mt-3 flex flex-col gap-2.5">
        {options.map((option) => (
          <label key={option.value} className={OPTION_ROW}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={RADIO}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <GroupError id={errorId} message={error} />
    </fieldset>
  )
}

export function SchoolPicker({ value = '', onChange, error }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  return (
    <fieldset aria-describedby={errorId}>
      <legend className={LEGEND}>
        School <RequiredMark />
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SCHOOLS.map((school) => {
          const active = value === school.value
          return (
            <label key={school.value} className="cursor-pointer">
              <input
                type="radio"
                name="school"
                value={school.value}
                checked={active}
                onChange={() => onChange(school.value)}
                className="peer sr-only"
              />
              <span
                style={{ backgroundColor: school.color }}
                className={cn(
                  'flex h-[44px] items-center justify-center rounded-[8px] text-[15px] font-extrabold tracking-wide text-white transition-all',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forge-ink',
                  active ? 'shadow-md ring-2 ring-forge-ink/20' : 'opacity-45 hover:opacity-80'
                )}
              >
                {school.label}
              </span>
            </label>
          )
        })}
      </div>
      <GroupError id={errorId} message={error} />
    </fieldset>
  )
}
