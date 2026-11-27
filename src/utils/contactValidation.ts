export const vietnamesePhone = /^0[0-9]{9,10}$/;
export const personName = /^[\p{L}\p{M}]+(?: +[\p{L}\p{M}]+)*$/u;
export const streetAddress = /^[\p{L}\p{M}\p{N} .,/()–-]+$/u;
export const contactEmail = /^[^\s<>@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
export const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^\p{L}\p{N}\s]).+$/u;
