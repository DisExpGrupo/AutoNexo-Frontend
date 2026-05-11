module.exports = {
  default: {
    import: [
      'e2e/support/hooks.ts',
      'e2e/support/world.ts',
      'e2e/steps/**/*.ts',
    ],
    paths: [
      'e2e/features/car_owner_create_request.feature',
      'e2e/features/workshop_send_offer.feature',
      'e2e/features/car_owner_accept_offer.feature',
    ],
    format: ['summary'],
    publishQuiet: true,
  },
};
