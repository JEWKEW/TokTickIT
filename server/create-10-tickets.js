import http from 'http';

const ticketsData = [
  {
    categoryId: '1',
    relatedSystemId: '3',
    requestedPriority: 'High',
    summary: 'Cannot connect to campus VPN from home',
    description: 'Receiving authentication timeout error when attempting to establish VPN connection.',
  },
  {
    categoryId: '2',
    relatedSystemId: '6',
    requestedPriority: 'Urgent',
    summary: 'Laptop screen flickering continuously',
    description: 'Display panel flickers violently whenever graphics intensive applications are launched.',
  },
  {
    categoryId: '3',
    relatedSystemId: '4',
    requestedPriority: 'Medium',
    summary: 'LEB2 assignment submission button unresponsive',
    description: 'Clicking submit on assignment portal gives a 500 server error.',
  },
  {
    categoryId: '4',
    relatedSystemId: '2',
    requestedPriority: 'Low',
    summary: 'Weak Wi-Fi signal in Library 3rd floor',
    description: 'Signal drops frequently near the west wing seating area.',
  },
  {
    categoryId: '1',
    relatedSystemId: '1',
    requestedPriority: 'High',
    summary: 'Password reset link not arriving in inbox',
    description: 'Requested password reset twice but confirmation email has not been delivered.',
  },
  {
    categoryId: '3',
    relatedSystemId: '5',
    requestedPriority: 'Urgent',
    summary: 'Grade calculation mismatch in final report',
    description: 'Weighted total calculation differs from column sum in the gradebook grid.',
  },
  {
    categoryId: '2',
    relatedSystemId: '6',
    requestedPriority: 'Low',
    summary: 'Keyboard spacebar key sticking',
    description: 'Mechanical resistance when pressing spacebar key on laptop keyboard.',
  },
  {
    categoryId: '4',
    relatedSystemId: '3',
    requestedPriority: 'Medium',
    summary: 'Intermittent connection drops on VPN gateway 2',
    description: 'VPN session drops every 15 minutes while connected to gateway 2.',
  },
  {
    categoryId: '1',
    relatedSystemId: '4',
    requestedPriority: 'Medium',
    summary: 'Requesting TA role permissions for CS101',
    description: 'Need teaching assistant access added to CS101 course roster.',
  },
  {
    categoryId: '3',
    relatedSystemId: '1',
    requestedPriority: 'High',
    summary: 'Outlook inbox syncing slowly',
    description: 'Syncing emails takes over 10 minutes when receiving attachments.',
  },
];

async function createTicket(data, userId = 1) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    for (const [key, val] of Object.entries(data)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${val}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/tickets',
        method: 'POST',
        headers: {
          'x-user-id': userId.toString(),
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(resData));
          } else {
            reject(new Error(`Status ${res.statusCode}: ${resData}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creating 10 tickets with random priorities and categories...');
  for (let i = 0; i < ticketsData.length; i++) {
    const t = ticketsData[i];
    try {
      const res = await createTicket(t, 1); // User 1 (Alice Johnson)
      console.log(`Created ticket ${i + 1}/10: [${res.data.ticketNumber}] ${t.summary} (Priority: ${t.requestedPriority})`);
    } catch (err) {
      console.error(`Failed to create ticket ${i + 1}:`, err.message);
    }
  }
  console.log('Finished creating 10 tickets.');
}

main();
