/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export const configureWinstonForTests = winston => {
  // Only log errors during tests
  winston.configure({
    transports: [
      new winston.transports.Console({
        level: 'error',
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ],
  });

  // override error handler to ensure stack trace is preserved
  // -- see https://github.com/winstonjs/winston/issues/1338
  // eslint-disable-next-line no-param-reassign
  winston.error = (item, params) => {
    const message = item instanceof Error ? item.stack : item;
    winston.log({ level: 'error', message, ...params });
  };
};
