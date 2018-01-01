const path = require('path');
const fs = require('fs');
const test = require('ava');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
const _ = require('lodash');

const Email = require('../lib');

const root = path.join(__dirname, 'fixtures', 'emails');

test('deep merges config', t => {
  const email = new Email({
    transport: { jsonTransport: true },
    juiceResources: {
      preserveImportant: false,
      webResources: {
        images: false
      }
    }
  });
  t.is(
    email.config.juiceResources.webResources.relativeTo,
    path.resolve('build')
  );
});

test('returns itself without transport', t => {
  t.true(new Email() instanceof Email);
});

test('inline css with juice using render without transport', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const html = await email.render('test/html', {
    name: 'niftylettuce'
  });
  const $ = cheerio.load(html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('returns itself', t => {
  t.true(
    new Email({
      transport: {
        jsonTransport: true
      }
    }) instanceof Email
  );
});

test('allows custom nodemailer transport instances', t => {
  t.true(
    new Email({
      transport: nodemailer.createTransport({
        jsonTransport: true
      })
    }) instanceof Email
  );
});

test('send email', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(_.isObject(res));
});

test('send two emails with two different locals', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  let res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce1' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for niftylettuce1');
  res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce2' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for niftylettuce2');
  t.pass();
});

test('send email with attachment', async t => {
  const filePath = path.join(__dirname, 'fixtures', 'filename.png');
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const attachments = [
    {
      filename: 'filename.png',
      path: filePath,
      content: fs.createReadStream(filePath),
      cid: 'EmbeddedImageCid'
    }
  ];
  const res = await email.send({
    message: {
      from: 'niftylettuce+from@gmail.com',
      attachments
    }
  });
  t.true(Array.isArray(JSON.parse(res.message).attachments));
});

test('send email with locals.user.last_locale', async t => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    i18n: {}
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com'
    },
    locals: {
      name: 'niftylettuce',
      user: {
        last_locale: 'en'
      }
    }
  });
  t.true(_.isObject(res));
});

test('send email with locals.locale', async t => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    i18n: {}
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com'
    },
    locals: {
      name: 'niftylettuce',
      locale: 'en'
    }
  });
  t.true(_.isObject(res));
});

test('throws error with missing template on render call', async t => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const error = await t.throws(
    email.render('missing', {
      name: 'niftylettuce'
    })
  );
  t.regex(error.message, /no such file or directory/);
});

test('send email with html to text disabled', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    htmlToText: false
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(_.isObject(res));
});

test('inline css with juice using render', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const html = await email.render('test/html', {
    name: 'niftylettuce'
  });
  const $ = cheerio.load(html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('inline css with juice using send', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  const $ = cheerio.load(message.html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('render text.pug only if html.pug does not exist', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test-text-only',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(_.isObject(res));
  res.message = JSON.parse(res.message);
  t.true(_.isUndefined(res.message.html));
  t.is(res.message.text, 'Hi niftylettuce,\nThis is just a test.');
});

test('render text-only email with `textOnly` option', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    textOnly: true,
    htmlToText: false
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(_.isObject(res));
  res.message = JSON.parse(res.message);
  t.true(_.isUndefined(res.message.html));
  t.is(res.message.text, 'Hi niftylettuce,\nThis is just a test.');
});
