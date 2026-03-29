import { spawn } from 'child_process';
import { createInterface } from 'readline';

const env = {
  UNIFI_LOCAL_VERIFY_SSL: 'false',
  UNIFI_API_KEY: 'c2XWfnpVIwVCMsS8g35hbWw2oKB5uNT2',
  UNIFI_LOCAL_HOST: '192.168.100.1',
  UNIFI_API_TYPE: 'local',
};

const server = spawn('node', ['build/index.js'], {
  cwd: '/home/debian/.openclaw/workspace/work/unifi-mcp-openapi',
  env: { ...process.env, ...env },
  stdio: ['pipe', 'pipe', 'inherit'],
});

const rl = createInterface({ input: server.stdout });
let id = 1;

function send(method, params = {}) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id: id++, method, params });
  server.stdin.write(msg + '\n');
  console.log('>>>', msg.substring(0, 100));
}

function receive() {
  return new Promise((resolve) => {
    rl.once('line', (line) => {
      console.log('<<<', line.substring(0, 200));
      resolve(JSON.parse(line));
    });
  });
}

async function main() {
  // Initialize
  send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' },
  });
  await receive();

  // List tools
  send('tools/list', {});
  const listResult = await receive();
  console.log('\n=== TOOLS LIST ===');
  if (listResult.result?.tools) {
    listResult.result.tools.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}: ${t.description?.substring(0, 60)}...`);
    });
  } else {
    console.log(JSON.stringify(listResult, null, 2));
  }

  // Call legacy stats tool
  console.log('\n=== CALL legacy-client-stats ===');
  send('tools/call', {
    name: 'unifi-legacy-client-stats',
    arguments: {},
  });
  const callResult = await receive();
  console.log('Result:', JSON.stringify(callResult, null, 2).substring(0, 500));

  server.kill();
  process.exit(0);
}

main().catch(console.error);
