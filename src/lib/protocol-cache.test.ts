import { describe, it, expect, beforeEach, vi } from "vitest";
import { 
  getCacheKey, 
  saveToCache, 
  loadFromCache, 
  clearCache,
  hasLegacyData,
  getLegacyData,
  clearLegacyData 
} from "./protocol-cache";
import { ProtocolState } from "./protocol-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const mockState: ProtocolState = {
  schemaVersion: 2,
  currentDay: 1,
  plant: {
    name: "Test Orchid",
    species: "",
    unknownSpecies: false,
    location: "",
    pot: "",
    substrate: "",
    difficulty: "",
    photo: null,
  },
  diagnosis: {
    roots: [],
    leaves: [],
    environment: [],
    potAndSubstrate: [],
    wateringAndRoutine: [],
  },
  diagnosisResult: null,
  diagnosisStatus: "none",
  answersVersion: 0,
  days: {},
  applications: [],
  finalEval: { improved: "", same: "", attention: "", keep: "", path: "" },
  onboarded: false,
};

describe("Protocol Cache System", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should use 'guest' key for visitors", () => {
    expect(getCacheKey("guest")).toBe("plantaefert-protocolo-21d:guest");
  });

  it("should use UUID for authenticated users", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(getCacheKey(uuid)).toBe(`plantaefert-protocolo-21d:${uuid}`);
  });

  it("should save and load state correctly per user", () => {
    const userA = "user-a";
    const userB = "user-b";
    
    const stateA = { ...mockState, plant: { ...mockState.plant, name: "User A Plant" } };
    const stateB = { ...mockState, plant: { ...mockState.plant, name: "User B Plant" } };
    
    saveToCache(userA, stateA);
    saveToCache(userB, stateB);
    
    expect(loadFromCache(userA)?.plant.name).toBe("User A Plant");
    expect(loadFromCache(userB)?.plant.name).toBe("User B Plant");
  });

  it("should reject cache if userId mismatch", () => {
    const userA = "user-a";
    const stateA = { ...mockState };
    
    saveToCache(userA, stateA);
    
    // Simulate manual corruption/mismatch
    const key = getCacheKey(userA);
    const envelope = JSON.parse(localStorage.getItem(key)!);
    envelope.userId = "wrong-user";
    localStorage.setItem(key, JSON.stringify(envelope));
    
    expect(loadFromCache(userA)).toBeNull();
  });

  it("should handle legacy data migration", () => {
    const legacyKey = "plantaefert-protocolo-21d";
    localStorage.setItem(legacyKey, JSON.stringify(mockState));
    
    expect(hasLegacyData()).toBe(true);
    expect(getLegacyData()?.plant.name).toBe("Test Orchid");
    
    clearLegacyData();
    expect(hasLegacyData()).toBe(false);
  });
});
