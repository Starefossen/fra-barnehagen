'use strict';

const BHG_URL = 'https://www.bjerknesparkenbarnehage.no';

exports.entries = function parseEntries(data) {
  let match;

  const res = [];

  const re = new RegExp([
    '<entry>',
    '<title>([^<]+)</title>',
    '<link href="([^"]+)" />',
    '<updated>([^<]+)</updated>',
  ].join('\r\n\t\t'), 'gi');

  while (match = re.exec(data)) {
    res.push({
      id: parseInt(match[2].replace(BHG_URL + '/nyhet.php?id=', ''), 10),
      title: match[1],
      link: match[2],
      updated: new Date(match[3]),
    });
  };

  return res;
};

exports.entry = function parseEntry(data) {
  let doc;

  const documents = [];

  const reTitle = /<h1>([^<]+)<\/h1>/gi.exec(data);
  const reBody = /<p class="ingress">([^<]+)<\/p>/gi.exec(data);
  const reDocs = /href="(\/dokument\/\?id=[0-9]+)">([^<]+)<\/a><\/td>/gi;

  while (doc = reDocs.exec(data)) {
    documents.push({
      id: parseInt(doc[1].replace('/dokument/?id=', ''), 10),
      url: BHG_URL + doc[1],
      title: doc[2],
    });
  }

  return({
    title: reTitle ? reTitle[1] : 'No Title',
    body: reBody ? reBody[1] : 'No Content',
    documents: documents,
  });
};
