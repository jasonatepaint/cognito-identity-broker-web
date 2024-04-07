/**
 * Determines if a string is empty, null or undefined
 */
export const isNullOrEmpty = (value?: string) => {
    return value === undefined || value == null || value.length === 0;
};

const validEmail = new RegExp(
    "^$|[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(;[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*$",
);
export const isValidEmail = (value: string) => {
    return validEmail.test(value);
};
