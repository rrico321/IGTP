'use client'

interface BrowseFiltersProps {
  q: string
  gpuModel: string
  minVram: string
  showAll: boolean
}

const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500'
const LABEL = 'text-xs font-medium text-zinc-400 mb-1 block'

export function BrowseFilters({ q, gpuModel, minVram, showAll }: BrowseFiltersProps) {
  return (
    <form method="GET" action="/browse" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="q" className={LABEL}>
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Name or GPU…"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="gpuModel" className={LABEL}>
            GPU Model
          </label>
          <input
            id="gpuModel"
            name="gpuModel"
            type="text"
            defaultValue={gpuModel}
            placeholder="e.g. RTX 4090"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="minVram" className={LABEL}>
            Min VRAM (GB)
          </label>
          <input
            id="minVram"
            name="minVram"
            type="number"
            min={0}
            defaultValue={minVram}
            placeholder="e.g. 24"
            className={INPUT}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
            <input
              type="checkbox"
              name="showAll"
              value="1"
              defaultChecked={showAll}
              className="w-4 h-4 accent-white"
            />
            Show all statuses
          </label>
          <button
            type="submit"
            className="w-full bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </form>
  )
}
