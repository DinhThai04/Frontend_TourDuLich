export function adminPagination(noun: string) {
  return { pageSize: 10, showTotal: (total: number, [first, last]: [number, number]) => `${first}–${last} / ${total} ${noun}` };
}
