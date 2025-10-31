import fs from 'node:fs'

const DEV_MODE = typeof process.env.DEV_MODE !== undefined;

export function isDocker() {
  if (!DEV_MODE) return false;
  const isDocker = fs.existsSync('/.dockerenv')
  if (isDocker) console.log('Running in Docker, using fake encrypted connection string')
  return isDocker;
}