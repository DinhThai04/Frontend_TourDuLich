export function customerRoute(path: string) {
  const booking = path === '/booking';
  const invoice = /^\/invoice\/booking\/\d+$/.test(path);
  const tour = path.match(/^\/tours\/detail\/(\d+)$/);
  return {
    checkoutStep: booking ? 0 : invoice ? 1 : null,
    paymentResult: path.startsWith('/payment/'),
    assistantVisible: path === '/' || path === '/about' || path === '/policies' || path === '/profile' || path === '/tours' || path === '/tours/search' || !!tour || booking || invoice,
    tourId: tour ? Number(tour[1]) : null,
  };
}
