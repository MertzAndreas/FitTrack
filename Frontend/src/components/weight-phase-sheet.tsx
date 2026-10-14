import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DateField } from '@/components/date-field'
import { NumberField } from '@/components/number-field'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  MAINTAIN_TOLERANCE,
  phaseDirectionLabels,
  validatePhaseTarget,
  weightAt,
  type Phase,
} from '@/lib/weight-phase'
import { newId, type WeightEntry } from '@/lib/weight'
import { formatDay } from '@/lib/weight-dates'

type WeightPhaseSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The phase being edited, or undefined to create a new one. */
  phase?: Phase
  entries: WeightEntry[]
  onSubmit: (phase: Phase) => void
  onDelete: (id: string) => void
}

export function WeightPhaseSheet({
  open,
  onOpenChange,
  phase,
  entries,
  onSubmit,
  onDelete,
}: WeightPhaseSheetProps) {
  const latest = entries.at(-1)

  const [startDate, setStartDate] = useState(formatDay(new Date()))
  const [target, setTarget] = useState<number | undefined>(undefined)
  const [rate, setRate] = useState<number | undefined>(undefined)
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const targetRef = useRef<HTMLInputElement>(null)

  // Seed the form each time the sheet opens.
  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    if (phase) {
      setStartDate(phase.startDate)
      setTarget(phase.targetWeight)
      // Shown as a magnitude; the sign is re-derived from the direction.
      setRate(Math.abs(phase.ratePercentPerWeek))
      setTargetDate(phase.targetDate)
      return
    }
    setStartDate(latest?.date ?? formatDay(new Date()))
    setTarget(undefined)
    setRate(undefined)
    setTargetDate(undefined)
    requestAnimationFrame(() => targetRef.current?.focus())
    // base is derived from phase/entries; keying on open + phase id is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase?.id])

  const startWeight = weightAt(entries, startDate)

  // Direction is fixed by the target against the phase's START weight, and the
  // target is then validated against the current weight too.
  const delta =
    target !== undefined && startWeight !== undefined
      ? target - startWeight
      : undefined
  const direction =
    delta === undefined
      ? undefined
      : delta < -MAINTAIN_TOLERANCE
        ? 'cut'
        : delta > MAINTAIN_TOLERANCE
          ? 'bulk'
          : 'maintain'

  const targetProblem =
    target !== undefined
      ? validatePhaseTarget(entries, target, { startDate })
      : undefined

  // The rate is a magnitude in the form; the sign comes from the direction.
  const signedRate =
    rate === undefined
      ? undefined
      : direction === 'cut'
        ? -Math.abs(rate)
        : direction === 'bulk'
          ? Math.abs(rate)
          : 0

  const canSave =
    target !== undefined &&
    rate !== undefined &&
    direction !== undefined &&
    targetProblem === undefined

  const confirm = () => {
    if (!canSave || target === undefined || signedRate === undefined) return
    onSubmit({
      id: phase?.id ?? newId('phase'),
      startDate,
      targetWeight: target,
      ratePercentPerWeek: signedRate,
      ...(targetDate ? { targetDate } : {}),
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (phase) onDelete(phase.id)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerHeader className="flex-row items-center gap-2">
          <div className="min-w-0 flex-1">
            <DrawerTitle>{phase ? 'Edit phase' : 'New goal'}</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              confirm()
            }}
          >
            <div className="space-y-1.5">
              <DateField
                label="Starts"
                value={startDate}
                onChange={setStartDate}
                ariaLabel="Pick a start date"
              />
              {startWeight !== undefined ? (
                <p className="text-xs text-muted-foreground tabular-nums">
                  Starting from {startWeight} kg
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="phase-target"
                label="Target"
                unit="kg"
                value={target}
                onChange={setTarget}
                inputRef={targetRef}
              />
              <NumberField
                id="phase-rate"
                label="Rate"
                unit="%/wk"
                value={rate}
                onChange={setRate}
              />
            </div>

            <DateField
              label="Target date (optional)"
              value={targetDate}
              onChange={setTargetDate}
              ariaLabel="Pick a target date"
              placeholder="No deadline"
              onClear={() => setTargetDate(undefined)}
              clearLabel="Clear target date"
            />

            {targetProblem ? (
              <p className="text-xs text-destructive">{targetProblem}</p>
            ) : direction ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {direction === 'maintain'
                  ? `Maintaining around ${target} kg`
                  : `${phaseDirectionLabels[direction]} of ${Math.abs(delta!).toFixed(1)} kg at ${rate ?? 0}%/week`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter a target weight.
              </p>
            )}
          </form>

          <div className="mt-6 flex gap-3">
            {phase ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={() =>
                  confirmDelete ? handleDelete() : setConfirmDelete(true)
                }
              >
                <Trash2 />
                {confirmDelete ? 'Confirm' : 'Delete'}
              </Button>
            ) : null}
            <Button
              className="flex-1"
              size="lg"
              onClick={confirm}
              disabled={!canSave}
            >
              {phase ? 'Save' : 'Start goal'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
