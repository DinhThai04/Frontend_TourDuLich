export const ALL_PERMISSIONS = {
  AUTH: {
    LOGIN: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/login',
      module: 'AUTH',
    },
    INTROSPECT: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/introspect',
      module: 'AUTH',
    },
    REFRESH_TOKEN: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/refresh',
      module: 'AUTH',
    },
    LOGOUT: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/logout',
      module: 'AUTH',
    },
    CHANGE_PASSWORD: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/Change-password',
      module: 'AUTH',
    },
  },
  PRICE: {
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/pricing/prices',
      module: 'PRICE',
    },
    UPDATE: {
      method: 'POST',
      apiPath: '/api/v1/pricing/prices/{id}',
      module: 'PRICE',
    },

    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/pricing/prices',
      module: 'PRICE',
    },
  },
  USERS: {
    REGISTER: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/register',
      module: 'USERS',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/auth/users/list',
      module: 'USERS',
    },
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/auth/users/{id}',
      module: 'USERS',
    },
    UPDATE: {
      method: 'POST',
      apiPath: '/api/v1/auth/users/UpdateUser/{id}',
      module: 'USERS',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/auth/users/{id}',
      module: 'USERS',
    },
  },

  PERMISSIONS: {
    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/auth/permissions',
      module: 'PERMISSIONS',
    },
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/auth/permissions',
      module: 'PERMISSIONS',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/auth/permissions/list',
      module: 'PERMISSIONS',
    },
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/auth/permissions/{id}',
      module: 'PERMISSIONS',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/auth/permissions/{id}',
      module: 'PERMISSIONS',
    },
  },

  ROLES: {
    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/auth/roles',
      module: 'ROLES',
    },
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/auth/roles/{id}',
      module: 'ROLES',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/auth/roles/{id}',
      module: 'ROLES',
    },
  },

  REVIEWS: {
    GET_BY_TOUR: {
      method: 'GET',
      apiPath: '/api/v1/auth/reviews/tour/{tourId}',
      module: 'REVIEWS',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/auth/reviews/list',
      module: 'REVIEWS',
    },
  },

  BOOKINGS: {
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/booking/book/{id}',
      module: 'BOOKINGS',
    },
    GET_ALL: {
      method: 'GET',
      apiPath: '/api/v1/booking/book/all',
      module: 'BOOKINGS',
    },
    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/booking/book/create',
      module: 'BOOKINGS',
    },
    UPDATE_STATUS: {
      method: 'PUT',
      apiPath: '/api/v1/booking/book/{id}/status',
      module: 'BOOKINGS',
    },
  },

  CUSTOMERS: {
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/booking/customer/{id}',
      module: 'CUSTOMERS',
    },
    GET_ALL: {
      method: 'GET',
      apiPath: '/api/v1/booking/customer/all',
      module: 'CUSTOMERS',
    },
    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/booking/customer/create',
      module: 'CUSTOMERS',
    },
  },

  TOURS: {
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/tour/tours/list',
      module: 'TOURS',
    },
    CREATE: {
      method: 'POST',
      apiPath: '/api/v1/tour/tours',
      module: 'TOURS',
    },
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/tour/tours/{id}',
      module: 'TOURS',
    },
  },

  TOUR_DEPARTURES: {
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/list',
      module: 'TOUR_DEPARTURES',
    },
    GET_BY_TOUR: {
      method: 'GET',
      apiPath: '/api/v1/tour/tour-departures/tour/{tourId}',
      module: 'TOUR_DEPARTURES',
    },
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/tour/tour-departures/{id}',
      module: 'TOUR_DEPARTURES',
    },
  },

  LOCATIONS: {
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/tour/locations/{id}',
      module: 'LOCATIONS',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/tour/locations/{id}',
      module: 'LOCATIONS',
    },
    GET_DEPARTURES: {
      method: 'GET',
      apiPath: '/api/v1/tour/locations/departures',
      module: 'LOCATIONS',
    },
    GET_DESTINATIONS: {
      method: 'GET',
      apiPath: '/api/v1/tour/locations/destinations',
      module: 'LOCATIONS',
    },
  },

  ITINERARIES: {
    GET_DETAIL: {
      method: 'GET',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
    GET_BY_TOUR: {
      method: 'GET',
      apiPath: '/api/v1/tour/itineraries/tour/{tourId}',
      module: 'ITINERARIES',
    },
    UPDATE: {
      method: 'PUT',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
    DELETE: {
      method: 'DELETE',
      apiPath: '/api/v1/tour/itineraries/{id}',
      module: 'ITINERARIES',
    },
  },

  VEHICLES: {
    GET_LIST: {
      method: 'GET',
      apiPath: '/api/v1/tour/vehicles/list',
      module: 'VEHICLES',
    },
  },
};
