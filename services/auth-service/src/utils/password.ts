export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import("bcryptjs");
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  const bcrypt = await import("bcryptjs");
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};
