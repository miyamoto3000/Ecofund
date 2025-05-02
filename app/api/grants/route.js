import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const grantsPath = path.join(process.cwd(), 'scripts', 'initialGrants.json');
    const rawData = fs.readFileSync(grantsPath, 'utf-8');
    const grants = JSON.parse(rawData);
    return new Response(JSON.stringify(grants), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading initialGrants.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch grants' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}