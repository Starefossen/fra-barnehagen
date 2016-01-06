'use strict';

const assert = require('assert');
const bhg = require('../lib/bhg');

let BHG_SESSION = null;

before((done) => {
  const user = process.env.BHG_USERNAME;
  const pass = process.env.BHG_PASSWORD;

  bhg.getSession(user, pass, (e, session) => {
    assert.ifError(e);
    BHG_SESSION = session;

    done();
  });
});

describe('getSession()', () => {
  it('returns session for valid username and password', () => {
    assert.equal(typeof BHG_SESSION, 'string');
    /PHPSESSID=[0-9a-f]{32}/.test(BHG_SESSION);
  });
});

describe('getEntries()', () => {
  it('returns list of recent news entries', (done) => {
    bhg.getEntries(BHG_SESSION, (e, entries) => {
      assert.ifError(e);

      assert.equal(entries.length, 10);

      for (const entry of entries) {
        assert.equal(typeof entry.id, 'number');
        assert.equal(typeof entry.title, 'string');
        assert.equal(typeof entry.link, 'string');
        assert(entry.updated instanceof Date);
      }

      done();
    });
  });
});

describe('getEntry()', () => {
  it('retruns data for valid document news entry', (done) => {
    bhg.getEntry(BHG_SESSION, 3609, (e, entry) => {
      assert.ifError(e);

      assert.deepEqual(entry, {
        title: 'Bjerknesparken, avd.Nordlys, mnd.plan januar 2016',
        body: 'Vedlagt er månedsplanen og planlagte aktiviteter for januar.',
        documents: [{
          id: 2227,
          url: `${process.env.BHG_URL}/dokument/?id=2227`,
          title: 'Månedsplan for Bjerknesparken, avd. Nordlys, Jan.2016',
        }],
        albums: [],
      });

      done();
    });
  });

  it('returns data for valid album news entry', (done) => {
    bhg.getEntry(BHG_SESSION, 3562, (e, entry) => {
      assert.ifError(e);

      assert.deepEqual(entry, {
        title: 'Bilder, Nordlys uke 50',
        body: 'Hei, her er noen bilder fra uken som har gått.\r\nFortsatt god helg :)',
        documents: [],
        albums: [{
          id: 2300,
          title: 'Nordlys, bilder, uke 50 &middot; 13.12.2015',
          url: 'https://www.bjerknesparkenbarnehage.no/foreldre/galleri/?id=2300',
        }],
      });

      done();
    });
  });

  it('returns error for non existing news entry', (done) => {
    bhg.getEntry(BHG_SESSION, 0, (e, entry) => {
      assert.equal(e.message, 'Entry Not Found');
      assert.equal(e.code, 404);
      assert.equal(entry, undefined);

      done();
    });
  });

  it('return error for in accessible news entry', (done) => {
    bhg.getEntry(BHG_SESSION, 3620, (e, entry) => {
      assert.equal(e.message, 'Forbidden Entry');
      assert.equal(e.code, 403);
      assert.equal(entry, undefined);

      done();
    });
  });
});

describe('getDocument()', () => {
  it('returns data for valid document', (done) => {
    bhg.getDocument(BHG_SESSION, 2227, (e, document) => {
      assert.ifError(e);

      assert(/.pdf$/.test(document.title));
      assert(document.body instanceof Buffer);

      done();
    });
  });

  it('return error for invalid document', (done) => {
    bhg.getDocument(BHG_SESSION, 0, (e, document) => {
      assert.equal(e.code, 404);
      assert.equal(e.message, 'Document Not Found');
      assert.equal(document, undefined);

      done();
    });
  });
});
