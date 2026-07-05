import {
  BedrockAgentCoreClient,
  InvokeHarnessCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { randomUUID } from 'node:crypto';

const client = new BedrockAgentCoreClient({ region: 'us-east-1' });

console.log('Sending InvokeHarness...');
console.time('InvokeHarness');

try {
  const response = await client.send(
    new InvokeHarnessCommand({
      harnessArn: 'arn:aws:bedrock-agentcore:us-east-1:202633084296:harness/cloudRosettadevAgent-9g4g7TWWeP',
      runtimeSessionId: randomUUID(),
      messages: [
        {
          role: 'user',
          content: [{ text: 'Reply with just the word OK' }],
        },
      ],
    }),
  );

  console.log('Response received, reading stream...');

  if (!response.stream) {
    console.log('No stream in response');
    process.exit(1);
  }

  let text = '';
  let eventCount = 0;
  for await (const event of response.stream) {
    eventCount++;
    console.log(`Event ${eventCount}:`, JSON.stringify(Object.keys(event)));

    if ('contentBlockDelta' in event && event.contentBlockDelta) {
      const delta = event.contentBlockDelta.delta;
      if (delta && 'text' in delta && delta.text) {
        text += delta.text;
        process.stdout.write(delta.text);
      }
    }
    if ('messageStop' in event) {
      console.log('\n[messageStop received]');
    }
  }

  console.timeEnd('InvokeHarness');
  console.log(`\nTotal events: ${eventCount}`);
  console.log(`Full text: ${text}`);
} catch (error) {
  console.timeEnd('InvokeHarness');
  console.error('Error:', error);
}
