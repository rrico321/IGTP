import Link from 'next/link'
import { MachineForm } from '../MachineForm'
import { createMachineAction } from '../actions'

export default function NewMachinePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/machines"
            className="text-zinc-500 text-xs hover:text-zinc-300 mb-2 inline-block"
          >
            ← My Machines
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Register a Machine
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Add your GPU hardware to IGTP so trusted people can request access.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <MachineForm
            action={createMachineAction}
            submitLabel="Register Machine"
            cancelHref="/machines"
          />
        </div>
      </div>
    </div>
  )
}
