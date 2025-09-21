export const setGenericPassword = jest.fn(() => Promise.resolve(true));
export const getGenericPassword = jest.fn(() => Promise.resolve(null));
export const resetGenericPassword = jest.fn(() => Promise.resolve());

export default {
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
};
