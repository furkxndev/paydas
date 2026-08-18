const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());

export const isStrongEnoughPassword = (value: string): boolean => value.length >= 6;

export const required = (
  value: string | undefined | null,
  label: string,
): string | undefined => (value && value.trim().length > 0 ? undefined : `${label} zorunludur`);

export const validateLogin = (values: { email: string; password: string }) => {
  const errors: ValidationErrors<typeof values> = {};
  if (!values.email.trim()) errors.email = 'E-posta zorunludur';
  else if (!isValidEmail(values.email)) errors.email = 'Geçerli bir e-posta girin';
  if (!values.password) errors.password = 'Şifre zorunludur';
  return errors;
};

export const validateRegister = (values: {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}) => {
  const errors: ValidationErrors<typeof values> = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Ad soyad en az 2 karakter olmalı';
  if (!values.email.trim()) errors.email = 'E-posta zorunludur';
  else if (!isValidEmail(values.email)) errors.email = 'Geçerli bir e-posta girin';
  if (!isStrongEnoughPassword(values.password))
    errors.password = 'Şifre en az 6 karakter olmalı';
  if (values.password !== values.passwordConfirm)
    errors.passwordConfirm = 'Şifreler eşleşmiyor';
  return errors;
};

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some(Boolean);
