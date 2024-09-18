import {create} from 'zustand';

interface CurrentPackState {
  currentPackId: string | null;
  setCurrentPackId: (id: string | null) => void;
}

export const ROCKS = 'rocks';
export const WATER = 'water';

type MapType = typeof ROCKS | typeof WATER;

interface MapTypeState {
  mapType: MapType;
  setMapType: (type: MapType) => void;
}

interface PacksModalState {
  packsModalShown: boolean;
  showPacksModal: () => void;
  hidePacksModal: () => void;
}

export interface AppState {
  currentPack: CurrentPackState;
  map: MapTypeState;
  packsModal: PacksModalState;
}

const useAppStore = create<AppState>(set => ({
  currentPack: {
    currentPackId: null,
    setCurrentPackId: (id: string | null) => set(state => {
      // Directly updating the currentPackId property to avoid unnecessary object creation
      state.currentPack.currentPackId = id;
      return { currentPack: state.currentPack };
    }),
  },
  map: {
    mapType: 'rocks',
    setMapType: (type: MapType) => set(state => {
      // Directly updating the mapType property to avoid unnecessary object creation
      state.map.mapType = type;
      return { map: state.map };
    }),
  },
  packsModal: {
    packsModalShown: false,
    showPacksModal: () => set(state => {
      // Directly updating the packsModalShown property to avoid unnecessary object creation
      state.packsModal.packsModalShown = true;
      return { packsModal: state.packsModal };
    }),
    hidePacksModal: () => set(state => {
      // Directly updating the packsModalShown property to avoid unnecessary object creation
      state.packsModal.packsModalShown = false;
      return { packsModal: state.packsModal };
    }),
  },
}));

// Selectors
// Since state is divided into sub-objects that don't change, I don't want to
// extract them from state b/c changes to their members will never register.
// Exporting only these selectors ensures I'm only accessing the data that I can
// react to.
export const useCurrentPackId = () => useAppStore(s => s.currentPack.currentPackId);
export const useSetCurrentPackId = () => useAppStore(s => s.currentPack.setCurrentPackId);
export const useMapType = () => useAppStore(s => s.map.mapType);
export const useSetMapType = () => useAppStore(s => s.map.setMapType);
export const usePacksModalShown = () => useAppStore(s => s.packsModal.packsModalShown);
export const useShowPacksModal = () => useAppStore(s => s.packsModal.showPacksModal);
export const useHidePacksModal = () => useAppStore(s => s.packsModal.hidePacksModal);
