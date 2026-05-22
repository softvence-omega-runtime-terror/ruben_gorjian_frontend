import { create } from 'zustand'

interface ScrollState {
  scroll: boolean
  toggleScroll: () => void
}

const useScrollStore = create<ScrollState>((set) => ({
  scroll: true,
  toggleScroll: () => set((state) => ({ scroll: !state.scroll })),
}))

export default useScrollStore;