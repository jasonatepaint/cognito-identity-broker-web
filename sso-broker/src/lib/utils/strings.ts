/**
 * Determines if a string is empty, null or undefined
 */
export const isNullOrEmpty = (value?: string) => {
    return value === undefined || value == null || value.length === 0;
};
