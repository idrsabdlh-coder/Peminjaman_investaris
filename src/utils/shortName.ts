// Nama singkat: potong di " / " pertama, lalu batasi panjangnya
export const shortName = (name: string, max = 26) => {
  const base = name.split(' / ')[0].trim();
  return base.length > max ? base.slice(0, max).trim() + '…' : base;
};