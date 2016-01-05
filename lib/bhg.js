'use strict';

const request = require('request');
const parser = require('./parser');
const HttpError = require('@starefossen/node-http-error');

exports.getSession = function getSession(user, pass, cb) {
  const opts = {
    method: 'POST',
    url: `${process.env.BHG_URL}/foreldre/login/`,
    form: {
      user_user: user,
      user_password: pass,
    },
  };

  request(opts, (e, r) => {
    if (e) { return cb(new HttpError('Session Fetch Failed', 500, e)); }

    if (r.statusCode !== 200) {
      return cb(new HttpError('Session Fetch Failed', r.statusCode));
    }

    if (!r.headers['set-cookie']) {
      return cb(new HttpError('No Session Found'));
    }

    return cb(null, r.headers['set-cookie'][0].split(';')[0]);
  });
};

exports.getEntries = function getEntries(session, cb) {
  const opts = {
    url: `${process.env.BHG_URL}/rss/nyheter.php`,
    headers: { Cookie: session },
  };

  request(opts, (e, r, body) => {
    if (e) { return cb(new HttpError('Entries Fetch Failed', 500, e)); }

    if (r.statusCode !== 200) {
      return cb(new HttpError('Entries Fetch Failed', r.statusCode));
    }

    return cb(null, parser.entries(body));
  });
};

exports.getEntry = function getEntry(session, id, cb) {
  const opts = {
    url: `${process.env.BHG_URL}/nyhet.php?id=${id}`,
    headers: { Cookie: session },
  };

  request(opts, (e, r, body) => {
    if (e) { return cb(new HttpError('Entry Fetch Failed', 500, e)); }

    if (/<h1>Feil<\/h1>/.test(body)) {
      return cb(new HttpError('Entry Not Found', 404));
    };

    if (/<h1>Ingen tilgang<\/h1>/.test(body)) {
      return cb(new HttpError('Forbidden Entry', 403));
    };

    if (r.statusCode !== 200) {
      return cb(new HttpError('Entry Fetch Failed', r.statusCode));
    }

    cb(null, parser.entry(body));
  });
};

exports.getDocument = function getDocument(session, id, cb) {
  const opts = {
    url: `${process.env.BHG_URL}/dokument/?id=${id}`,
    headers: { Cookie: session },
    encoding: null,
  };

  request(opts, (e, r, body) => {
    if (e) { return cb(new HttpError('Document Fetch Failed', 500, e)); }

    if (body.toString('utf8') === 'FEIL') {
      return cb(new HttpError('Document Not Found', 404));
    }

    if (r.statusCode !== 200) {
      return cb(new HttpError('Document Error', r.statusCode));
    }

    if (r.headers['content-type'] !== 'application/force-download') {
      return cb(new HttpError(`Invalid Content Type ${r.headers['content-type']}`));
    }

    if (!r.headers['content-disposition']) {
      return cb(new HttpError('No Content Disposition Header Found'));
    }

    return cb(null, {
      title: r.headers['content-disposition'].split('=')[1].replace(/"/g, ''),
      body: body
    });
  });
};
