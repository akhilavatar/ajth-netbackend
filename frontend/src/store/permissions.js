import { create } from "zustand";

export const usePermissionsStore = create((set) => ({
  permissions: {
    location: null,
    camera: null,
    microphone: null,
    motionSensors: null,
    notifications: null,
  },
  setPermission: (permission, value) =>
    set((state) => ({
      permissions: { ...state.permissions, [permission]: value },
    })),
}));