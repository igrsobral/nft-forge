export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'

export const envScenario = import.meta.env.VITE_MOCK_SCENARIO ?? 'success'
