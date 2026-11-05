// Quyền được khớp theo `code` ổn định (backend phát hành authority PERM:<code>).
// `method`/`apiPath` chỉ còn là mô tả endpoint cho màn quản trị, không dùng để phân quyền.
export const ALL_PERMISSIONS = {
  INVOICES: {
    GET_ALL: { code: 'INVOICES_GET_ALL', method: 'GET', apiPath: '/api/v1/invoice/direct/all', module: 'INVOICES' },
  },
  BOOKING_CHANGES: {
    READ: { code: 'CHANGES_READ', method: 'GET', apiPath: '/api/v1/booking/changes/admin', module: 'BOOKING_CHANGES' },
    CREATE: { code: 'SHOP_CHANGE_CREATE', method: 'POST', apiPath: '/api/v1/booking/changes/shop', module: 'BOOKING_CHANGES' },
    REVIEW: { code: 'CHANGES_REVIEW', method: 'POST', apiPath: '/api/v1/booking/changes/{id}/review', module: 'BOOKING_CHANGES' },
    REFUND: { code: 'REFUNDS_RECORD', method: 'POST', apiPath: '/api/v1/booking/changes/{id}/refund', module: 'BOOKING_CHANGES' },
  },
  AUTH: {
    LOGIN: {
      code: 'AUTH_LOGIN',
      method: 'POST',
      apiPath: '/api/v1/auth/users/login',
      module: 'AUTH',
    },
    INTROSPECT: {
      code: 'AUTH_INTROSPECT',
      method: 'POST',
      apiPath: '/api/v1/auth/users/introspect',
      module: 'AUTH',
    },
    REFRESH_TOKEN: {
      code: 'AUTH_REFRESH_TOKEN',
      method: 'POST',
      apiPath: '/api/v1/auth/users/refresh',
      module: 'AUTH',
    },
    LOGOUT: {
      code: 'AUTH_LOGOUT',
      method: 'POST',
      apiPath: '/api/v1/auth/users/logout',
      module: 'AUTH',
    },
    CHANGE_PASSWORD: {
      code: 'AUTH_CHANGE_PASSWORD',
      method: 'POST',
      apiPath: '/api/v1/auth/users/Change-password',
      module: 'AUTH',
    },
  },
  PRICE: {
    GET_LIST: {
      code: 'PRICE_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/pricing/prices',
      module: 'PRICE',
    },
    UPDATE: {
      code: 'PRICE_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/pricing/prices/{id}',
      module: 'PRICE',
    },

    CREATE: {
      code: 'PRICE_CREATE',
      method: 'POST',
      apiPath: '/api/v1/pricing/prices',
      module: 'PRICE',
    },
  },
  USERS: {
    STATUS: { code: 'USER_STATUS_UPDATE', method: 'PUT', apiPath: '/api/v1/auth/users/{id}/status', module: 'USERS' },
    ARCHIVE: { code: 'USER_ARCHIVE', method: 'POST', apiPath: '/api/v1/auth/users/{id}/archive', module: 'USERS' },
    EVENTS: { code: 'USER_ACCOUNT_EVENTS', method: 'GET', apiPath: '/api/v1/auth/users/{id}/events', module: 'USERS' },
    REGISTER: {
      code: 'USERS_REGISTER',
      method: 'POST',
      apiPath: '/api/v1/auth/users/register',
      module: 'USERS',
    },
    GET_LIST: {
      code: 'USERS_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/auth/users/list',
      module: 'USERS',
    },
    GET_DETAIL: {
      code: 'USERS_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/auth/users/{id}',
      module: 'USERS',
    },
    UPDATE: {
      code: 'USERS_UPDATE',
      method: 'POST',
      apiPath: '/api/v1/auth/users/UpdateUser/{id}',
      module: 'USERS',
    },
    DELETE: {
      code: 'USERS_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/auth/users/{id}',
      module: 'USERS',
    },
  },

  PERMISSIONS: {
    CREATE: {
      code: 'PERMISSIONS_CREATE',
      method: 'POST',
      apiPath: '/api/v1/auth/permissions',
      module: 'PERMISSIONS',
    },
    UPDATE: {
      code: 'PERMISSIONS_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/auth/permissions',
      module: 'PERMISSIONS',
    },
    GET_LIST: {
      code: 'PERMISSIONS_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/auth/permissions/list',
      module: 'PERMISSIONS',
    },
    GET_DETAIL: {
      code: 'PERMISSIONS_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/auth/permissions/{id}',
      module: 'PERMISSIONS',
    },
    DELETE: {
      code: 'PERMISSIONS_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/auth/permissions/{id}',
      module: 'PERMISSIONS',
    },
  },

  ROLES: {
    CREATE: {
      code: 'ROLES_CREATE',
      method: 'POST',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    UPDATE: {
      code: 'ROLES_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    GET_LIST: {
      code: 'ROLES_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    GET_DETAIL: {
      code: 'ROLES_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/auth/roles/{id}',
      module: 'ROLES',
    },
    DELETE: {
      code: 'ROLES_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/auth/roles/{id}',
      module: 'ROLES',
    },
  },

  REVIEWS: {
    GET_BY_TOUR: {
      code: 'REVIEWS_GET_BY_TOUR',
      method: 'GET',
      apiPath: '/api/v1/auth/reviews/tour/{tourId}',
      module: 'REVIEWS',
    },
    GET_LIST: {
      code: 'REVIEWS_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/auth/reviews/list',
      module: 'REVIEWS',
    },
  },

  BOOKINGS: {
    GET_DETAIL: {
      code: 'BOOKINGS_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/booking/book/{id}',
      module: 'BOOKINGS',
    },
    GET_ALL: {
      code: 'BOOKINGS_GET_ALL',
      method: 'GET',
      apiPath: '/api/v1/booking/book/all',
      module: 'BOOKINGS',
    },
    CREATE: {
      code: 'BOOKINGS_CREATE',
      method: 'POST',
      apiPath: '/api/v1/booking/book/create',
      module: 'BOOKINGS',
    },
  },

  CUSTOMERS: {
    GET_DETAIL: {
      code: 'CUSTOMERS_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/booking/customer/{id}',
      module: 'CUSTOMERS',
    },
    GET_ALL: {
      code: 'CUSTOMERS_GET_ALL',
      method: 'GET',
      apiPath: '/api/v1/booking/customer/all',
      module: 'CUSTOMERS',
    },
    CREATE: {
      code: 'CUSTOMERS_CREATE',
      method: 'POST',
      apiPath: '/api/v1/booking/customer/create',
      module: 'CUSTOMERS',
    },
  },

  TOURS: {
    GET_DETAIL: {
      code: 'TOURS_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
    GET_LIST: {
      code: 'TOURS_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/tour/tours/list',
      module: 'TOURS',
    },
    CREATE: {
      code: 'TOURS_CREATE',
      method: 'POST',
      apiPath: '/api/v1/tour/tours',
      module: 'TOURS',
    },
    UPDATE: {
      code: 'TOURS_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
    DELETE: {
      code: 'TOURS_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
  },

  TOUR_DEPARTURES: {
    CREATE: {
      code: 'TOUR_DEPARTURES_CREATE',
      method: 'POST',
      apiPath: '/api/v1/tour/tour-departures',
      module: 'TOUR_DEPARTURES',
    },
    GET_DETAIL: {
      code: 'TOUR_DEPARTURES_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
    GET_LIST: {
      code: 'TOUR_DEPARTURES_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/list',
      module: 'TOUR_DEPARTURES',
    },
    GET_BY_TOUR: {
      code: 'TOUR_DEPARTURES_GET_BY_TOUR',
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/tour/{tourId}',
      module: 'TOUR_DEPARTURES',
    },
    UPDATE: {
      code: 'TOUR_DEPARTURES_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
    DELETE: {
      code: 'TOUR_DEPARTURES_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
  },

  LOCATIONS: {
    CREATE: {
      code: 'LOCATIONS_CREATE',
      method: 'POST',
      apiPath: '/api/v1/tour/locations',
      module: 'LOCATIONS',
    },
    UPDATE: {
      code: 'LOCATIONS_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/tour/locations/{id}',
      module: 'LOCATIONS',
    },
    DELETE: {
      code: 'LOCATIONS_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/tour/locations/{id}',
      module: 'LOCATIONS',
    },
    GET_DEPARTURES: {
      code: 'LOCATIONS_GET_DEPARTURES',
      method: 'GET',
      apiPath: '/api/v1/tour/locations/departures',
      module: 'LOCATIONS',
    },
    GET_DESTINATIONS: {
      code: 'LOCATIONS_GET_DESTINATIONS',
      method: 'GET',
      apiPath: '/api/v1/tour/locations/destinations',
      module: 'LOCATIONS',
    },
  },

  ITINERARIES: {
    CREATE: {
      code: 'ITINERARIES_CREATE',
      method: 'POST',
      apiPath: '/api/v1/tour/itineraries',
      module: 'ITINERARIES',
    },
    GET_DETAIL: {
      code: 'ITINERARIES_GET_DETAIL',
      method: 'GET',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
    GET_BY_TOUR: {
      code: 'ITINERARIES_GET_BY_TOUR',
      method: 'GET',
      apiPath: '/api/v1/tour/itineraries/tour/{tourId}',
      module: 'ITINERARIES',
    },
    UPDATE: {
      code: 'ITINERARIES_UPDATE',
      method: 'PUT',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
    DELETE: {
      code: 'ITINERARIES_DELETE',
      method: 'DELETE',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
  },

  VEHICLES: {
    GET_LIST: {
      code: 'VEHICLES_GET_LIST',
      method: 'GET',
      apiPath: '/api/v1/tour/vehicles/list',
      module: 'VEHICLES',
    },
  },
  PAYMENT_RECONCILIATION: {
    GET_LIST: { code: 'RECONCILIATION_READ', method: 'GET', apiPath: '/api/v1/payment/reconciliation', module: 'PAYMENT_RECONCILIATION' },
    HISTORY: { code: 'RECONCILIATION_HISTORY', method: 'GET', apiPath: '/api/v1/payment/reconciliation/{txnRef}/history', module: 'PAYMENT_RECONCILIATION' },
    RESOLVE: { code: 'RECONCILIATION_RESOLVE', method: 'POST', apiPath: '/api/v1/payment/reconciliation/{txnRef}/resolve', module: 'PAYMENT_RECONCILIATION' },
  },
};
